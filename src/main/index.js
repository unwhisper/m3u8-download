import { app, BrowserWindow, ipcMain, shell } from 'electron'
import Config from '../../static/js/config'
const Store = require('electron-store')
let store = new Store()

const path = require('path')
const { Parser } = require('m3u8-parser')
const fs = require('fs')
const async = require('async')
const dateFormat = require('dateformat')
const crypto = require('crypto')
const got = require('got')
const ffmpeg = require('fluent-ffmpeg')
const download = require('download')
const httpTimeout = {socket: 300000, request: 300000, response:300000};
const ffmpegPath = process.env.NODE_ENV == 'development' ? path.resolve(__dirname, '../../ffmpeg.exe') : path.resolve(__dirname, '../../../ffmpeg.exe')
ffmpeg.setFfmpegPath(ffmpegPath)

let mainWindow = null
var configVideos = [];
let globalCond = {};
const globalConfigDir = app.getPath('userData');
const globalConfigVideoPath = path.join(globalConfigDir,'config_videos.json');

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 550,
    width: 700,
    useContentSize: true,
    minWidth:700,
    minHeight:550,
    maxWidth:700,
    maxHeight:550,
    frame: false,
    show:false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  new Config(mainWindow)

  mainWindow.loadURL(winURL)
  
  mainWindow.on('ready-to-show', function () {
    mainWindow.show() // 初始化后再显示
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

let playerWindow = null
function createPlayerWindow(src) {
	if(playerWindow == null)
	{
		// 创建浏览器窗口
		playerWindow = new BrowserWindow({
			width: 1024,
			height: 620,
			skipTaskbar: false,
			transparent: false, 
			frame: false, 
			resizable: true,
			webPreferences: {
				nodeIntegration: true
			},
			alwaysOnTop: false,
			hasShadow: false,
			parent: mainWindow
		});
		playerWindow.setMenu(null)
		playerWindow.on('closed', () => {
			// 取消引用 window 对象，如果你的应用支持多窗口的话，
			// 通常会把多个 window 对象存放在一个数组里面，
			// 与此同时，你应该删除相应的元素。
			playerWindow = null;
		})
	}
	// 加载index.html文件
    let playerSrc = process.env.NODE_ENV == 'development' ? path.resolve(__dirname, '../../static/player.html') : path.resolve(__dirname, './static/player.html')
	playerWindow.loadFile(playerSrc, {search:"src="+src});
}

app.on('ready', createWindow)
app.allowRendererProcessReuse = true

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('opendir', function (event, arg) {
	shell.openExternal(arg);
});

ipcMain.on('playvideo', function (event, arg) {
	createPlayerWindow(arg);
});

ipcMain.on('delvideo', function (event, id) {
	configVideos.forEach(Element=>{
		if(Element.id==id)
		{
			try {
				if(fs.existsSync(Element.dir)) {
					var files = fs.readdirSync(Element.dir)
					files.forEach(e=>{
						fs.unlinkSync(path.join(Element.dir,e) );
					})
					fs.rmdirSync(Element.dir,{recursive :true})
				} 
				var nIdx = configVideos.indexOf(Element);
				if( nIdx > -1)
				{
					configVideos.splice(nIdx,1);
					fs.writeFileSync(globalConfigVideoPath,JSON.stringify(configVideos));
				}
				event.sender.send("delvideo-reply",Element);
			} catch (error) {
				console.log(error)
			}
		}
	});
});

ipcMain.on('StartOrStop', function (event, arg) {
	let id = Number.parseInt(arg);
	if(globalCond[id] == null)
	{
		console.log("不存在此任务")
		return;
	}
	globalCond[id] = !globalCond[id];
	if(globalCond[id] == true)
	{
		configVideos.forEach(Element=>{
			if(Element.id==id)
			{
				if(Element.isLiving == true)
				{
					startDownloadLive(Element.url, Element.headers, id);
				}
				else
				{
					startDownload(Element.url, Element.headers, id);
				}
			}
		});
	}
});

ipcMain.on('task-add', async function (event, arg, headers) {
  	let src = arg;
	let _headers = {};
	if(headers != '')
	{
		let __ = headers.match(/(.*?): ?(.*?)(\n|\r|$)/g);
		__ && __.forEach((_)=>{
			let ___ = _.match(/(.*?): ?(.*?)(\n|\r|$)/i);
			___ && (_headers[___[1]] = ___[2]);
		});
	}

	let mes = src.match(/^https?:\/\/[^/]*/);
	let _hosts = '';
	if(mes && mes.length >= 1)
	{
		_hosts = mes[0];
	}

	if(_headers['Origin'] == null && _headers['origin'] == null)
	{
		_headers['Origin'] = _hosts;
	}
	if(_headers['Referer'] == null && _headers['referer'] == null)
	{
		_headers['Referer'] = _hosts;   
	}
  	const response = await got(src, {headers: _headers, timeout: httpTimeout, https: {rejectUnauthorized: false}}).catch((error) => { console.log(error) })
	{
		let info = '';
		let code = 0;
		code = -1;
    	info = '解析资源失败！';
		if (response && response.body != null
			&& response.body != '')
		{
			let parser = new Parser();
			parser.push(response.body);
      		parser.end();
      		let count_seg = parser.manifest.segments.length;
			if (count_seg > 0) {
				code = 0;
				if (parser.manifest.endList) {
					let duration = 0;
					parser.manifest.segments.forEach(segment => {
						duration += segment.duration;
					});
          			info = `资源解析成功，有 ${count_seg} 个片段，时长：${formatTime(duration)}，即将开始缓存...`;
					startDownload(src, _headers);
				} else {
					info = `直播资源解析成功，即将开始缓存...`;
					startDownloadLive(src, _headers);
				}
			}
		}
		event.sender.send('task-add-reply', { code: code, message: info });
	}
})

function formatTime(duration) {
	let sec = Math.floor(duration % 60).toLocaleString();
	let min = Math.floor(duration / 60 % 60).toLocaleString();
	let hour = Math.floor(duration / 3600 % 60).toLocaleString();
	if (sec.length != 2) sec = '0' + sec;
	if (min.length != 2) min = '0' + min;
	if (hour.length != 2) hour = '0' + hour;
	return hour + ":" + min + ":" + sec;
}


class QueueObject {
	constructor() {
		this.segment = null;
		this.url = '';
		this.headers = '';
		this.id = 0;
		this.idx = 0;
		this.dir = '';
		this.then = this.catch = null;
	}
	async callback( _callback ) {
		try{
			if(!globalCond[this.id])
			{
				console.log(`globalCond[this.id] is not exsited.`);
				return;
			}

			let partent_uri = this.url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
			let segment = this.segment;
			let uri_ts = '';
			if (/^http.*/.test(segment.uri)) {
				uri_ts = segment.uri;
			}
			else if(/^\/.*/.test(segment.uri))
			{
				let mes = this.url.match(/^https?:\/\/[^/]*/);
				if(mes && mes.length >= 1)
				{
					uri_ts = mes[0] + segment.uri;
				}
				else
				{
					uri_ts = partent_uri + segment.uri;
				}
			}
			else
			{
				uri_ts = partent_uri + segment.uri;
			}
			let filename = `${ ((this.idx + 1) +'').padStart(6,'0')}.ts`;
			let filpath = path.join(this.dir, filename);
			let filpath_dl = path.join(this.dir, filename+".dl");

			// console.log(`2 ${segment.uri}`,`${filename}`);

			//检测文件是否存在
			for (let index = 0; index < 3 && !fs.existsSync(filpath); index++) {
				// 下载的时候使用.dl后缀的文件名，下载完成后重命名
				let that = this;
				await download (uri_ts, that.dir, {filename:filename + ".dl",timeout:httpTimeout,headers:that.headers}).catch((err)=>{
					console.log(err)
					if(fs.existsSync(filpath_dl)) fs.unlinkSync( filpath_dl);
				});

				if(!fs.existsSync(filpath_dl)) continue;
				if( fs.statSync(filpath_dl).size <= 0 )
				{
					fs.unlinkSync(filpath_dl);
				}

				if(segment.key != null && segment.key.method != null)
				{
					//标准解密TS流
					let aes_path = path.join(this.dir, "aes.key" );
					if(!fs.existsSync( aes_path ))
					{
						let key_uri = segment.key.uri;
						if (! /^http.*/.test(segment.key.uri)) {
							key_uri = partent_uri + segment.key.uri;
						}
						else if(/^\/.*/.test(key_uri))
						{
							let mes = this.url.match(/^https?:\/\/[^/]*/);
							if(mes && mes.length >= 1)
							{
								key_uri = mes[0] + segment.key.uri;
							}
							else
							{
								key_uri = partent_uri + segment.key.uri;
							}
						}

						await download (key_uri, that.dir, { filename: "aes.key" ,headers:that.headers,timeout:httpTimeout}).catch(console.error);
					}
					if(fs.existsSync( aes_path ))
					{
						try {
							let key_ = fs.readFileSync( aes_path );
							let iv_ = segment.key.iv != null ? Buffer.from(segment.key.iv.buffer)
							:Buffer.from(that.idx.toString(16).padStart(32,'0') ,'hex' );
							let cipher = crypto.createDecipheriv((segment.key.method+"-cbc").toLowerCase(), key_, iv_);
							cipher.on('error', console.error);
							let inputData = fs.readFileSync( filpath_dl );
							let outputData =Buffer.concat([cipher.update(inputData),cipher.final()]);
							fs.writeFileSync(filpath,outputData);
							
							if(fs.existsSync(filpath_dl))
								fs.unlinkSync(filpath_dl);
							
							that.then && that.then();
						} catch (error) {
							logger.error(error)
							if(fs.existsSync( filpath_dl ))
								fs.unlinkSync(filpath_dl);
						}
						return;
					}
				}
				else
				{
					fs.renameSync(filpath_dl , filpath);
					break;
				}
			}
			if(fs.existsSync(filpath))
			{
				this.then && this.then();
			}
			else
			{
				this.catch && this.catch();
			}
		}
		catch(e)
		{
			console.log(e);
		}
		finally
		{
			_callback();
		}
	}
}

function queue_callback(that, callback)
{
	that.callback(callback);
}

async function startDownload(url, headers = null, nId = null) {
	let id = nId == null ? new Date().getTime() : nId;

  	let dir = path.join(store.get('downloadPath'), '/'+id);

	let filesegments = [];

	if(!fs.existsSync(dir))
	{
		fs.mkdirSync(dir, { recursive: true });
	}

	const response = await got(url, {headers: headers, timeout: httpTimeout, https: {rejectUnauthorized: false}}).catch((error) => { console.log(error) })
	if(response == null || response.body == null || response.body == '')
	{
		return;
	}
	let parser = new Parser();
	parser.push(response.body);
	parser.end();

	//并发 3 个线程下载
	var tsQueues = async.queue(queue_callback, 3);

	let count_seg = parser.manifest.segments.length;
	let count_downloaded = 0;
	var video = {
		id:id,
		url:url,
		dir:dir,
		segment_total:count_seg,
		segment_downloaded:count_downloaded,
		time: dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss"),
		status:'初始化...',
		isLiving:false,
		headers:headers,
		videopath:''
	};
	if(nId == null)
	{
		mainWindow.webContents.send('task-notify-create',video);
	}
	globalCond[id] = true;
	let segments = parser.manifest.segments;
	for (let iSeg = 0; iSeg < segments.length; iSeg++) {
		let qo = new QueueObject();
		qo.dir = dir;
		qo.idx = iSeg;
		qo.id = id;
		qo.url = url;
		qo.headers = headers;
		qo.segment = segments[iSeg];
		qo.then = function(){
			count_downloaded = count_downloaded + 1
			video.segment_downloaded = count_downloaded;
			video.status = `下载中...${count_downloaded}/${count_seg}`
			mainWindow.webContents.send('task-notify-update',video);
		};
		tsQueues.push(qo);
	}
	tsQueues.drain(()=>{
		console.log('download success');
		video.status = "已完成，合并中..."
		mainWindow.webContents.send('task-notify-end',video);
		let indexData = '';
		
		for (let iSeg = 0; iSeg < segments.length; iSeg++) {
			let filpath = path.join(dir, `${ ((iSeg + 1) +'').padStart(6,'0') }.ts`);
			indexData += `file '${filpath}'\r\n`;
			filesegments.push(filpath);
		}
		fs.writeFileSync(path.join(dir,'index.txt'),indexData);
		let outPathMP4 = path.join(dir,id+'.mp4');
		if(fs.existsSync(ffmpegPath))
		{
			ffmpeg()
				.input(`${path.join(dir,'index.txt')}`)
				.inputOptions(['-f concat', '-safe 0'])
				.outputOptions('-c copy')
				.output(`${outPathMP4}`)
				.on('start', function (commandLine) {
					console.log('Spawned Ffmpeg with command: ' + commandLine)
				})
				.on('codecData', function (data) {
					console.log('Input is ' + data.audio + ' audio ' + 'with ' + data.video + ' video')
				})
				.on('progress', function (progress) {
					console.log(progress.percent)
				})
				.on('error', function (err, stdout, stderr) {
					console.log('Cannot process video: ' + err.message)
					video.videopath = outPathMP4;
					video.status = "合成失败，可能是非标准加密视频源，请联系客服定制。"
					mainWindow.webContents.send('task-notify-end',video);
				})
				.on('end', function (stdout, stderr) {
					video.videopath = outPathMP4;
					video.status = "已完成"
					mainWindow.webContents.send('task-notify-end',video);
					let index_path = path.join(dir,'index.txt');
					if(fs.existsSync(index_path))
					{
						fs.unlinkSync(index_path);
					}
					filesegments.forEach(fileseg=>{
						if(fs.existsSync(fileseg))
						{
							fs.unlinkSync(fileseg);
						}
					});
				})
				.run()
				configVideos.push(video);
		}else{
			video.videopath = outPathMP4;
			video.status = "已完成，未发现本地FFMPEG，不进行合成。"
			mainWindow.webContents.send('task-notify-end',video);
		}
	});
	console.log("drain over");
}