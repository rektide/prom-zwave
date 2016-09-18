var
  OpenZwave= require("openzwave-shared"),
  util= require("util")

function factory( path, options){
	if(this instanceof factory){
		throw new Error("Invalid use of 'new'")
	}
	if( typeof path=== "object"){
		options= path
		path= undefined
	}
	path= path|| "/dev/ttyUSB0"
	options= options|| {}

	var zwave= new OpenZwave(options)
	Object.setPrototypeOf(zwave, PromZwave.prototype)
	zwave.path= path
	return zwave
}

function PromZwave(){}
util.inherits(PromZwave, OpenZwave)

PromZwave.prototype.eventLog= function(eventNames){
	var log= fs.createWriteStream("log.ndjson", {flags: "a"})
	log.write(JSON.stringify(["prom-zwave startup"]))
	var logHandler= (eventName)=> {
		return (...args)=> {
			var i= this.logDepth;
			args.unshift(eventName)
			if(log){
				log.write(JSON.stringify(args))
				log.write("\n")
			}
			for(; i>0&& !args[i-1]; --i){}
			args= args.slice(0, i)
			console.log.apply(console, args)
		}
	}
	var listen= (eventName)=> this.on( eventName, logHandler( eventName));
	[
		'driver ready',
		'driver failed',
		'scan complete',
		'node added',
		'node naming',
		'node available',
		'node ready',
		'node event',
		'polling enabled/disabled',
		'scene event',
		'value added',
		'value changed',
		'value removed',
		'notification',
	].forEach( listen)
}
PromZwave.prototype.logDepth= 3

var _connect= OpenZwave.prototype.connect
PromZwave.prototype.connect= function(path){
	_connect.call( this, path|| this.path)
}

function main(){
	var zwave= module.exports(process.argv[2], {
		ConsoleOutput: false
	})
	zwave.eventLog()
	zwave.connect()
	return zwave
}

module.exports= factory
module.exports.main= main

if(require.main=== module){
	main()
}
