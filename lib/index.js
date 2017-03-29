var fs = require('fs'),  
    path = require('path'),
    fileList = [],
    babylonFiles = [],
    binaryBabylonFiles =[];

function is_filetype(filename, types) { 
    types = types.split(','); 
    var pattern = '\.('; 
    for(var i=0; i<types.length; i++) {
        if(0 != i) { 
            pattern += '|'; 
        } 
        pattern += types[i].trim(); 
    } 
    pattern += ')$'; 
    return new RegExp(pattern, 'i').test(filename); 
}

function walk(dirPath){  
    var dirList = fs.readdirSync(dirPath);
    dirList.forEach(function(item){
        if(fs.statSync(dirPath + '/' + item).isFile()){
            fileList.push(dirPath + '/' + item);
        }
    });

    dirList.forEach(function(item){
        if(fs.statSync(dirPath + '/' + item).isDirectory()){
            walk(dirPath + '/' + item);
        }
    });
}

//创建多层文件夹 
function mkDir(dirpath,dirname){  
    //判断是否是第一次调用  
    if(typeof dirname === "undefined"){   
        if(fs.existsSync(dirpath)){  
            return;  
        }else{  
            mkDir(dirpath,path.dirname(dirpath));  
        }  
    }else{  
        //判断第二个参数是否正常，避免调用时传入错误参数  
        if(dirname !== path.dirname(dirpath)){   
            mkDir(dirpath);  
            return;  
        }  
        if(fs.existsSync(dirname)){  
            fs.mkdirSync(dirpath)  
        }else{  
            mkDir(dirname,path.dirname(dirname));  
            fs.mkdirSync(dirpath);  
        }  
    }  
} 


function mkFile(filePath,data){

    var dirPath = path.dirname(filePath),
        filename = path.basename(filePath);

    mkDir(dirPath)

    try{
        var str = JSON.stringify(data);
        fs.writeFile(filePath, str, function(){

        });
    }catch(err){
        var str = data;
        fs.writeFile(filePath, str, function(){

        });
    }
}


function splitBabylonFiles(files) {
    files.forEach(function(item){
        if(/.babylon$/.test(item)) {
            if(/.binary.babylon$/.test(item)) {
                binaryBabylonFiles.push(item)
            } else {
                babylonFiles.push(item)
            }
        }
    })

    // console.log(babylonFiles,binaryBabylonFiles)
}


function getAllBabylonFiles(dirPath) {
    walk(dirPath);
    splitBabylonFiles(fileList);
}

// walk('./single');console.log(fileList)

function loadPartBabylon(filePath) {
    try{
        var data = fs.readFileSync(filePath, "utf-8");
    } catch (err) {
        console.error(err.message)
    }
    

    return JSON.parse(data);
}

// var src = "./single/door_BC_001/door_BC_001.babylon";
// var data=loadPartBabylon(src);
// console.log(data); 



function deepClone(json) {
    var str, newJson;
    str = JSON.stringify(json, function(key, value) {
        return (typeof value == 'function' ? value.toString().replace(/^function(.*)/g,"jsonFunction$1") : value)
    })

    newJson = JSON.parse(str, function(key, value){
        if (/^jsonFunction(.*)/.test(value)) { 
            var strFun = '('+value.replace(/^jsonFunction(.*)/, "function$1")+')'; 
            value = eval(strFun); 
        } 
        return value;
    })

    return newJson;
}

// var ret = deepClone(data.meshes)
// console.log(ret)

function mergeBabylonData(json1, json2) {
    var ret = {
        meshes:[],
        materials:[],
        multiMaterials:[],
    };

    var ret1, ret2;
    ['meshes','materials','multiMaterials'].forEach(function(item, index){
        ret1 = deepClone(json1[item]);
        ret2 = deepClone(json2[item]);

        ret[item] = ret1.concat(ret2);
    })

    return ret;
}

function mergeBabylonData_SEO(retDataRef, json2){
    var ret;
    ['meshes','materials','multiMaterials'].forEach(function(item, index){
        ret = deepClone(json2[item]);
        // ret2 = deepClone(json2[item]);

        // ret[item] = ret1.concat(ret2);
        // console.log(retDataRef, item)
        retDataRef[item] = retDataRef[item].concat(ret)
    })
}
// console.log(require(src))


var mergeBabylonFile = function(arrSrc, outFile, useBinary){
    outFile = !!outFile ? outFile : './outdir/out.babylon';
    var retData={
         "producer":{
            "name":"3dsmax",
            "version":"2",
            "exporter_version":"0.4.5",
            "file":"xxx"
         },
        "autoClear":true,
        "clearColor":[0,0,0],
        "ambientColor":[0,0,0],
        "fogMode":0,
        "fogColor":null,
        "fogStart":0,
        "fogEnd":0,
        "fogDensity":0,
        "gravity":[0,0,0],
        "physicsEngine":null,
        "physicsEnabled":false,
        "physicsGravity":null,
        "cameras":[{"isStereoscopicSideBySide":false,"name":"Default camera","id":"2b2231cd-bbcc-4ea2-858d-4aff6583029b","parentId":null,"lockedTargetId":null,"type":"FreeCamera","position":["-Infinity","-Infinity","-Infinity"],"rotation":[0.0,0.0,0.0],"target":["-Infinity","-Infinity","-Infinity"],"fov":0.8,"minZ":1.0,"maxZ":"Infinity","speed":"Infinity","inertia":0.9,"interaxialDistance":0.0637,"checkCollisions":false,"applyGravity":false,"ellipsoid":null,"autoAnimate":false,"autoAnimateFrom":0,"autoAnimateTo":0,"autoAnimateLoop":false,"animations":null,"mode":0,"orthoLeft":null,"orthoRight":null,"orthoBottom":null,"orthoTop":null,"metadata":null,"tags":null}],
        "activeCameraID":"2b2231cd-bbcc-4ea2-858d-4aff6583029b",
        "lights":[],
        "meshes":[],
        "sounds":[],
        "materials":[],
        "multiMaterials":[],
        "particleSystems":null,
        "lensFlareSystems":null,
        "shadowGenerators":[],
        "skeletons":[],
        "actions":null,
        "metadata":null,
        "workerCollisions":false,
        "useDelayedTextureLoading":!!useBinary
    },
    mergeData = function(src){
        var data2=loadPartBabylon(src);

        // retData = mergeBabylonData(retData, data2)

        mergeBabylonData_SEO(retData, data2)
    };

    arrSrc.forEach(function(item, index){
        mergeData(item)
        console.log("merge the file :", item)
    })

    // console.log(retData)
    // 输出到 文件
    mkFile(outFile,retData)
}


// var src = "./single/door_BD_001/door_BD_001.babylon";
// mergeBabylonFile([src])






// 检查 所有 文件 id 是否重复

// -------------------main------------

module.exports = {

	createModule: function(arv){
		if(arv.length<2){
			console.error("Error: babylon-combine ./files/  outdir/out.babylon");
			return;
		}
		
		var filesDir = path.join( process.cwd(), arv[0]),
			outFile = path.join( process.cwd(), arv[1]),
			useBinary = arv[3];
		
			// console.log(filesDir,outFile,useBinary)
			// return;
		getAllBabylonFiles(filesDir);

		if(useBinary === true ) {
			mergeBabylonFile(binaryBabylonFiles,outFile,true);
		} else if(useBinary === false) {
			mergeBabylonFile(babylonFiles,outFile,false);
		} else {
			console.log('a..........')
			mergeBabylonFile(binaryBabylonFiles,outFile,true);
			mergeBabylonFile(babylonFiles,outFile,false);
		}
		


	}



}