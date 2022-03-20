//VALORIA.JS
//CREATED BY JAMES REZENDES

//LOCALFORAGE
!function(a){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var b;b="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,b.localforage=a()}}(function(){return function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c||a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){(function(a){"use strict";function c(){k=!0;for(var a,b,c=l.length;c;){for(b=l,l=[],a=-1;++a<c;)b[a]();c=l.length}k=!1}function d(a){1!==l.push(a)||k||e()}var e,f=a.MutationObserver||a.WebKitMutationObserver;if(f){var g=0,h=new f(c),i=a.document.createTextNode("");h.observe(i,{characterData:!0}),e=function(){i.data=g=++g%2}}else if(a.setImmediate||void 0===a.MessageChannel)e="document"in a&&"onreadystatechange"in a.document.createElement("script")?function(){var b=a.document.createElement("script");b.onreadystatechange=function(){c(),b.onreadystatechange=null,b.parentNode.removeChild(b),b=null},a.document.documentElement.appendChild(b)}:function(){setTimeout(c,0)};else{var j=new a.MessageChannel;j.port1.onmessage=c,e=function(){j.port2.postMessage(0)}}var k,l=[];b.exports=d}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],2:[function(a,b,c){"use strict";function d(){}function e(a){if("function"!=typeof a)throw new TypeError("resolver must be a function");this.state=s,this.queue=[],this.outcome=void 0,a!==d&&i(this,a)}function f(a,b,c){this.promise=a,"function"==typeof b&&(this.onFulfilled=b,this.callFulfilled=this.otherCallFulfilled),"function"==typeof c&&(this.onRejected=c,this.callRejected=this.otherCallRejected)}function g(a,b,c){o(function(){var d;try{d=b(c)}catch(b){return p.reject(a,b)}d===a?p.reject(a,new TypeError("Cannot resolve promise with itself")):p.resolve(a,d)})}function h(a){var b=a&&a.then;if(a&&("object"==typeof a||"function"==typeof a)&&"function"==typeof b)return function(){b.apply(a,arguments)}}function i(a,b){function c(b){f||(f=!0,p.reject(a,b))}function d(b){f||(f=!0,p.resolve(a,b))}function e(){b(d,c)}var f=!1,g=j(e);"error"===g.status&&c(g.value)}function j(a,b){var c={};try{c.value=a(b),c.status="success"}catch(a){c.status="error",c.value=a}return c}function k(a){return a instanceof this?a:p.resolve(new this(d),a)}function l(a){var b=new this(d);return p.reject(b,a)}function m(a){function b(a,b){function d(a){g[b]=a,++h!==e||f||(f=!0,p.resolve(j,g))}c.resolve(a).then(d,function(a){f||(f=!0,p.reject(j,a))})}var c=this;if("[object Array]"!==Object.prototype.toString.call(a))return this.reject(new TypeError("must be an array"));var e=a.length,f=!1;if(!e)return this.resolve([]);for(var g=new Array(e),h=0,i=-1,j=new this(d);++i<e;)b(a[i],i);return j}function n(a){function b(a){c.resolve(a).then(function(a){f||(f=!0,p.resolve(h,a))},function(a){f||(f=!0,p.reject(h,a))})}var c=this;if("[object Array]"!==Object.prototype.toString.call(a))return this.reject(new TypeError("must be an array"));var e=a.length,f=!1;if(!e)return this.resolve([]);for(var g=-1,h=new this(d);++g<e;)b(a[g]);return h}var o=a(1),p={},q=["REJECTED"],r=["FULFILLED"],s=["PENDING"];b.exports=e,e.prototype.catch=function(a){return this.then(null,a)},e.prototype.then=function(a,b){if("function"!=typeof a&&this.state===r||"function"!=typeof b&&this.state===q)return this;var c=new this.constructor(d);if(this.state!==s){g(c,this.state===r?a:b,this.outcome)}else this.queue.push(new f(c,a,b));return c},f.prototype.callFulfilled=function(a){p.resolve(this.promise,a)},f.prototype.otherCallFulfilled=function(a){g(this.promise,this.onFulfilled,a)},f.prototype.callRejected=function(a){p.reject(this.promise,a)},f.prototype.otherCallRejected=function(a){g(this.promise,this.onRejected,a)},p.resolve=function(a,b){var c=j(h,b);if("error"===c.status)return p.reject(a,c.value);var d=c.value;if(d)i(a,d);else{a.state=r,a.outcome=b;for(var e=-1,f=a.queue.length;++e<f;)a.queue[e].callFulfilled(b)}return a},p.reject=function(a,b){a.state=q,a.outcome=b;for(var c=-1,d=a.queue.length;++c<d;)a.queue[c].callRejected(b);return a},e.resolve=k,e.reject=l,e.all=m,e.race=n},{1:1}],3:[function(a,b,c){(function(b){"use strict";"function"!=typeof b.Promise&&(b.Promise=a(2))}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{2:2}],4:[function(a,b,c){"use strict";function d(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}function e(){try{if("undefined"!=typeof indexedDB)return indexedDB;if("undefined"!=typeof webkitIndexedDB)return webkitIndexedDB;if("undefined"!=typeof mozIndexedDB)return mozIndexedDB;if("undefined"!=typeof OIndexedDB)return OIndexedDB;if("undefined"!=typeof msIndexedDB)return msIndexedDB}catch(a){return}}function f(){try{if(!ua||!ua.open)return!1;var a="undefined"!=typeof openDatabase&&/(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent)&&!/Chrome/.test(navigator.userAgent)&&!/BlackBerry/.test(navigator.platform),b="function"==typeof fetch&&-1!==fetch.toString().indexOf("[native code");return(!a||b)&&"undefined"!=typeof indexedDB&&"undefined"!=typeof IDBKeyRange}catch(a){return!1}}function g(a,b){a=a||[],b=b||{};try{return new Blob(a,b)}catch(f){if("TypeError"!==f.name)throw f;for(var c="undefined"!=typeof BlobBuilder?BlobBuilder:"undefined"!=typeof MSBlobBuilder?MSBlobBuilder:"undefined"!=typeof MozBlobBuilder?MozBlobBuilder:WebKitBlobBuilder,d=new c,e=0;e<a.length;e+=1)d.append(a[e]);return d.getBlob(b.type)}}function h(a,b){b&&a.then(function(a){b(null,a)},function(a){b(a)})}function i(a,b,c){"function"==typeof b&&a.then(b),"function"==typeof c&&a.catch(c)}function j(a){return"string"!=typeof a&&(console.warn(a+" used as a key, but it is not a string."),a=String(a)),a}function k(){if(arguments.length&&"function"==typeof arguments[arguments.length-1])return arguments[arguments.length-1]}function l(a){for(var b=a.length,c=new ArrayBuffer(b),d=new Uint8Array(c),e=0;e<b;e++)d[e]=a.charCodeAt(e);return c}function m(a){return new va(function(b){var c=a.transaction(wa,Ba),d=g([""]);c.objectStore(wa).put(d,"key"),c.onabort=function(a){a.preventDefault(),a.stopPropagation(),b(!1)},c.oncomplete=function(){var a=navigator.userAgent.match(/Chrome\/(\d+)/),c=navigator.userAgent.match(/Edge\//);b(c||!a||parseInt(a[1],10)>=43)}}).catch(function(){return!1})}function n(a){return"boolean"==typeof xa?va.resolve(xa):m(a).then(function(a){return xa=a})}function o(a){var b=ya[a.name],c={};c.promise=new va(function(a,b){c.resolve=a,c.reject=b}),b.deferredOperations.push(c),b.dbReady?b.dbReady=b.dbReady.then(function(){return c.promise}):b.dbReady=c.promise}function p(a){var b=ya[a.name],c=b.deferredOperations.pop();if(c)return c.resolve(),c.promise}function q(a,b){var c=ya[a.name],d=c.deferredOperations.pop();if(d)return d.reject(b),d.promise}function r(a,b){return new va(function(c,d){if(ya[a.name]=ya[a.name]||B(),a.db){if(!b)return c(a.db);o(a),a.db.close()}var e=[a.name];b&&e.push(a.version);var f=ua.open.apply(ua,e);b&&(f.onupgradeneeded=function(b){var c=f.result;try{c.createObjectStore(a.storeName),b.oldVersion<=1&&c.createObjectStore(wa)}catch(c){if("ConstraintError"!==c.name)throw c;console.warn('The database "'+a.name+'" has been upgraded from version '+b.oldVersion+" to version "+b.newVersion+', but the storage "'+a.storeName+'" already exists.')}}),f.onerror=function(a){a.preventDefault(),d(f.error)},f.onsuccess=function(){c(f.result),p(a)}})}function s(a){return r(a,!1)}function t(a){return r(a,!0)}function u(a,b){if(!a.db)return!0;var c=!a.db.objectStoreNames.contains(a.storeName),d=a.version<a.db.version,e=a.version>a.db.version;if(d&&(a.version!==b&&console.warn('The database "'+a.name+"\" can't be downgraded from version "+a.db.version+" to version "+a.version+"."),a.version=a.db.version),e||c){if(c){var f=a.db.version+1;f>a.version&&(a.version=f)}return!0}return!1}function v(a){return new va(function(b,c){var d=new FileReader;d.onerror=c,d.onloadend=function(c){var d=btoa(c.target.result||"");b({__local_forage_encoded_blob:!0,data:d,type:a.type})},d.readAsBinaryString(a)})}function w(a){return g([l(atob(a.data))],{type:a.type})}function x(a){return a&&a.__local_forage_encoded_blob}function y(a){var b=this,c=b._initReady().then(function(){var a=ya[b._dbInfo.name];if(a&&a.dbReady)return a.dbReady});return i(c,a,a),c}function z(a){o(a);for(var b=ya[a.name],c=b.forages,d=0;d<c.length;d++){var e=c[d];e._dbInfo.db&&(e._dbInfo.db.close(),e._dbInfo.db=null)}return a.db=null,s(a).then(function(b){return a.db=b,u(a)?t(a):b}).then(function(d){a.db=b.db=d;for(var e=0;e<c.length;e++)c[e]._dbInfo.db=d}).catch(function(b){throw q(a,b),b})}function A(a,b,c,d){void 0===d&&(d=1);try{var e=a.db.transaction(a.storeName,b);c(null,e)}catch(e){if(d>0&&(!a.db||"InvalidStateError"===e.name||"NotFoundError"===e.name))return va.resolve().then(function(){if(!a.db||"NotFoundError"===e.name&&!a.db.objectStoreNames.contains(a.storeName)&&a.version<=a.db.version)return a.db&&(a.version=a.db.version+1),t(a)}).then(function(){return z(a).then(function(){A(a,b,c,d-1)})}).catch(c);c(e)}}function B(){return{forages:[],db:null,dbReady:null,deferredOperations:[]}}function C(a){function b(){return va.resolve()}var c=this,d={db:null};if(a)for(var e in a)d[e]=a[e];var f=ya[d.name];f||(f=B(),ya[d.name]=f),f.forages.push(c),c._initReady||(c._initReady=c.ready,c.ready=y);for(var g=[],h=0;h<f.forages.length;h++){var i=f.forages[h];i!==c&&g.push(i._initReady().catch(b))}var j=f.forages.slice(0);return va.all(g).then(function(){return d.db=f.db,s(d)}).then(function(a){return d.db=a,u(d,c._defaultConfig.version)?t(d):a}).then(function(a){d.db=f.db=a,c._dbInfo=d;for(var b=0;b<j.length;b++){var e=j[b];e!==c&&(e._dbInfo.db=d.db,e._dbInfo.version=d.version)}})}function D(a,b){var c=this;a=j(a);var d=new va(function(b,d){c.ready().then(function(){A(c._dbInfo,Aa,function(e,f){if(e)return d(e);try{var g=f.objectStore(c._dbInfo.storeName),h=g.get(a);h.onsuccess=function(){var a=h.result;void 0===a&&(a=null),x(a)&&(a=w(a)),b(a)},h.onerror=function(){d(h.error)}}catch(a){d(a)}})}).catch(d)});return h(d,b),d}function E(a,b){var c=this,d=new va(function(b,d){c.ready().then(function(){A(c._dbInfo,Aa,function(e,f){if(e)return d(e);try{var g=f.objectStore(c._dbInfo.storeName),h=g.openCursor(),i=1;h.onsuccess=function(){var c=h.result;if(c){var d=c.value;x(d)&&(d=w(d));var e=a(d,c.key,i++);void 0!==e?b(e):c.continue()}else b()},h.onerror=function(){d(h.error)}}catch(a){d(a)}})}).catch(d)});return h(d,b),d}function F(a,b,c){var d=this;a=j(a);var e=new va(function(c,e){var f;d.ready().then(function(){return f=d._dbInfo,"[object Blob]"===za.call(b)?n(f.db).then(function(a){return a?b:v(b)}):b}).then(function(b){A(d._dbInfo,Ba,function(f,g){if(f)return e(f);try{var h=g.objectStore(d._dbInfo.storeName);null===b&&(b=void 0);var i=h.put(b,a);g.oncomplete=function(){void 0===b&&(b=null),c(b)},g.onabort=g.onerror=function(){var a=i.error?i.error:i.transaction.error;e(a)}}catch(a){e(a)}})}).catch(e)});return h(e,c),e}function G(a,b){var c=this;a=j(a);var d=new va(function(b,d){c.ready().then(function(){A(c._dbInfo,Ba,function(e,f){if(e)return d(e);try{var g=f.objectStore(c._dbInfo.storeName),h=g.delete(a);f.oncomplete=function(){b()},f.onerror=function(){d(h.error)},f.onabort=function(){var a=h.error?h.error:h.transaction.error;d(a)}}catch(a){d(a)}})}).catch(d)});return h(d,b),d}function H(a){var b=this,c=new va(function(a,c){b.ready().then(function(){A(b._dbInfo,Ba,function(d,e){if(d)return c(d);try{var f=e.objectStore(b._dbInfo.storeName),g=f.clear();e.oncomplete=function(){a()},e.onabort=e.onerror=function(){var a=g.error?g.error:g.transaction.error;c(a)}}catch(a){c(a)}})}).catch(c)});return h(c,a),c}function I(a){var b=this,c=new va(function(a,c){b.ready().then(function(){A(b._dbInfo,Aa,function(d,e){if(d)return c(d);try{var f=e.objectStore(b._dbInfo.storeName),g=f.count();g.onsuccess=function(){a(g.result)},g.onerror=function(){c(g.error)}}catch(a){c(a)}})}).catch(c)});return h(c,a),c}function J(a,b){var c=this,d=new va(function(b,d){if(a<0)return void b(null);c.ready().then(function(){A(c._dbInfo,Aa,function(e,f){if(e)return d(e);try{var g=f.objectStore(c._dbInfo.storeName),h=!1,i=g.openKeyCursor();i.onsuccess=function(){var c=i.result;if(!c)return void b(null);0===a?b(c.key):h?b(c.key):(h=!0,c.advance(a))},i.onerror=function(){d(i.error)}}catch(a){d(a)}})}).catch(d)});return h(d,b),d}function K(a){var b=this,c=new va(function(a,c){b.ready().then(function(){A(b._dbInfo,Aa,function(d,e){if(d)return c(d);try{var f=e.objectStore(b._dbInfo.storeName),g=f.openKeyCursor(),h=[];g.onsuccess=function(){var b=g.result;if(!b)return void a(h);h.push(b.key),b.continue()},g.onerror=function(){c(g.error)}}catch(a){c(a)}})}).catch(c)});return h(c,a),c}function L(a,b){b=k.apply(this,arguments);var c=this.config();a="function"!=typeof a&&a||{},a.name||(a.name=a.name||c.name,a.storeName=a.storeName||c.storeName);var d,e=this;if(a.name){var f=a.name===c.name&&e._dbInfo.db,g=f?va.resolve(e._dbInfo.db):s(a).then(function(b){var c=ya[a.name],d=c.forages;c.db=b;for(var e=0;e<d.length;e++)d[e]._dbInfo.db=b;return b});d=a.storeName?g.then(function(b){if(b.objectStoreNames.contains(a.storeName)){var c=b.version+1;o(a);var d=ya[a.name],e=d.forages;b.close();for(var f=0;f<e.length;f++){var g=e[f];g._dbInfo.db=null,g._dbInfo.version=c}return new va(function(b,d){var e=ua.open(a.name,c);e.onerror=function(a){e.result.close(),d(a)},e.onupgradeneeded=function(){e.result.deleteObjectStore(a.storeName)},e.onsuccess=function(){var a=e.result;a.close(),b(a)}}).then(function(a){d.db=a;for(var b=0;b<e.length;b++){var c=e[b];c._dbInfo.db=a,p(c._dbInfo)}}).catch(function(b){throw(q(a,b)||va.resolve()).catch(function(){}),b})}}):g.then(function(b){o(a);var c=ya[a.name],d=c.forages;b.close();for(var e=0;e<d.length;e++){d[e]._dbInfo.db=null}return new va(function(b,c){var d=ua.deleteDatabase(a.name);d.onerror=d.onblocked=function(a){var b=d.result;b&&b.close(),c(a)},d.onsuccess=function(){var a=d.result;a&&a.close(),b(a)}}).then(function(a){c.db=a;for(var b=0;b<d.length;b++)p(d[b]._dbInfo)}).catch(function(b){throw(q(a,b)||va.resolve()).catch(function(){}),b})})}else d=va.reject("Invalid arguments");return h(d,b),d}function M(){return"function"==typeof openDatabase}function N(a){var b,c,d,e,f,g=.75*a.length,h=a.length,i=0;"="===a[a.length-1]&&(g--,"="===a[a.length-2]&&g--);var j=new ArrayBuffer(g),k=new Uint8Array(j);for(b=0;b<h;b+=4)c=Da.indexOf(a[b]),d=Da.indexOf(a[b+1]),e=Da.indexOf(a[b+2]),f=Da.indexOf(a[b+3]),k[i++]=c<<2|d>>4,k[i++]=(15&d)<<4|e>>2,k[i++]=(3&e)<<6|63&f;return j}function O(a){var b,c=new Uint8Array(a),d="";for(b=0;b<c.length;b+=3)d+=Da[c[b]>>2],d+=Da[(3&c[b])<<4|c[b+1]>>4],d+=Da[(15&c[b+1])<<2|c[b+2]>>6],d+=Da[63&c[b+2]];return c.length%3==2?d=d.substring(0,d.length-1)+"=":c.length%3==1&&(d=d.substring(0,d.length-2)+"=="),d}function P(a,b){var c="";if(a&&(c=Ua.call(a)),a&&("[object ArrayBuffer]"===c||a.buffer&&"[object ArrayBuffer]"===Ua.call(a.buffer))){var d,e=Ga;a instanceof ArrayBuffer?(d=a,e+=Ia):(d=a.buffer,"[object Int8Array]"===c?e+=Ka:"[object Uint8Array]"===c?e+=La:"[object Uint8ClampedArray]"===c?e+=Ma:"[object Int16Array]"===c?e+=Na:"[object Uint16Array]"===c?e+=Pa:"[object Int32Array]"===c?e+=Oa:"[object Uint32Array]"===c?e+=Qa:"[object Float32Array]"===c?e+=Ra:"[object Float64Array]"===c?e+=Sa:b(new Error("Failed to get type for BinaryArray"))),b(e+O(d))}else if("[object Blob]"===c){var f=new FileReader;f.onload=function(){var c=Ea+a.type+"~"+O(this.result);b(Ga+Ja+c)},f.readAsArrayBuffer(a)}else try{b(JSON.stringify(a))}catch(c){console.error("Couldn't convert value into a JSON string: ",a),b(null,c)}}function Q(a){if(a.substring(0,Ha)!==Ga)return JSON.parse(a);var b,c=a.substring(Ta),d=a.substring(Ha,Ta);if(d===Ja&&Fa.test(c)){var e=c.match(Fa);b=e[1],c=c.substring(e[0].length)}var f=N(c);switch(d){case Ia:return f;case Ja:return g([f],{type:b});case Ka:return new Int8Array(f);case La:return new Uint8Array(f);case Ma:return new Uint8ClampedArray(f);case Na:return new Int16Array(f);case Pa:return new Uint16Array(f);case Oa:return new Int32Array(f);case Qa:return new Uint32Array(f);case Ra:return new Float32Array(f);case Sa:return new Float64Array(f);default:throw new Error("Unkown type: "+d)}}function R(a,b,c,d){a.executeSql("CREATE TABLE IF NOT EXISTS "+b.storeName+" (id INTEGER PRIMARY KEY, key unique, value)",[],c,d)}function S(a){var b=this,c={db:null};if(a)for(var d in a)c[d]="string"!=typeof a[d]?a[d].toString():a[d];var e=new va(function(a,d){try{c.db=openDatabase(c.name,String(c.version),c.description,c.size)}catch(a){return d(a)}c.db.transaction(function(e){R(e,c,function(){b._dbInfo=c,a()},function(a,b){d(b)})},d)});return c.serializer=Va,e}function T(a,b,c,d,e,f){a.executeSql(c,d,e,function(a,g){g.code===g.SYNTAX_ERR?a.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name = ?",[b.storeName],function(a,h){h.rows.length?f(a,g):R(a,b,function(){a.executeSql(c,d,e,f)},f)},f):f(a,g)},f)}function U(a,b){var c=this;a=j(a);var d=new va(function(b,d){c.ready().then(function(){var e=c._dbInfo;e.db.transaction(function(c){T(c,e,"SELECT * FROM "+e.storeName+" WHERE key = ? LIMIT 1",[a],function(a,c){var d=c.rows.length?c.rows.item(0).value:null;d&&(d=e.serializer.deserialize(d)),b(d)},function(a,b){d(b)})})}).catch(d)});return h(d,b),d}function V(a,b){var c=this,d=new va(function(b,d){c.ready().then(function(){var e=c._dbInfo;e.db.transaction(function(c){T(c,e,"SELECT * FROM "+e.storeName,[],function(c,d){for(var f=d.rows,g=f.length,h=0;h<g;h++){var i=f.item(h),j=i.value;if(j&&(j=e.serializer.deserialize(j)),void 0!==(j=a(j,i.key,h+1)))return void b(j)}b()},function(a,b){d(b)})})}).catch(d)});return h(d,b),d}function W(a,b,c,d){var e=this;a=j(a);var f=new va(function(f,g){e.ready().then(function(){void 0===b&&(b=null);var h=b,i=e._dbInfo;i.serializer.serialize(b,function(b,j){j?g(j):i.db.transaction(function(c){T(c,i,"INSERT OR REPLACE INTO "+i.storeName+" (key, value) VALUES (?, ?)",[a,b],function(){f(h)},function(a,b){g(b)})},function(b){if(b.code===b.QUOTA_ERR){if(d>0)return void f(W.apply(e,[a,h,c,d-1]));g(b)}})})}).catch(g)});return h(f,c),f}function X(a,b,c){return W.apply(this,[a,b,c,1])}function Y(a,b){var c=this;a=j(a);var d=new va(function(b,d){c.ready().then(function(){var e=c._dbInfo;e.db.transaction(function(c){T(c,e,"DELETE FROM "+e.storeName+" WHERE key = ?",[a],function(){b()},function(a,b){d(b)})})}).catch(d)});return h(d,b),d}function Z(a){var b=this,c=new va(function(a,c){b.ready().then(function(){var d=b._dbInfo;d.db.transaction(function(b){T(b,d,"DELETE FROM "+d.storeName,[],function(){a()},function(a,b){c(b)})})}).catch(c)});return h(c,a),c}function $(a){var b=this,c=new va(function(a,c){b.ready().then(function(){var d=b._dbInfo;d.db.transaction(function(b){T(b,d,"SELECT COUNT(key) as c FROM "+d.storeName,[],function(b,c){var d=c.rows.item(0).c;a(d)},function(a,b){c(b)})})}).catch(c)});return h(c,a),c}function _(a,b){var c=this,d=new va(function(b,d){c.ready().then(function(){var e=c._dbInfo;e.db.transaction(function(c){T(c,e,"SELECT key FROM "+e.storeName+" WHERE id = ? LIMIT 1",[a+1],function(a,c){var d=c.rows.length?c.rows.item(0).key:null;b(d)},function(a,b){d(b)})})}).catch(d)});return h(d,b),d}function aa(a){var b=this,c=new va(function(a,c){b.ready().then(function(){var d=b._dbInfo;d.db.transaction(function(b){T(b,d,"SELECT key FROM "+d.storeName,[],function(b,c){for(var d=[],e=0;e<c.rows.length;e++)d.push(c.rows.item(e).key);a(d)},function(a,b){c(b)})})}).catch(c)});return h(c,a),c}function ba(a){return new va(function(b,c){a.transaction(function(d){d.executeSql("SELECT name FROM sqlite_master WHERE type='table' AND name <> '__WebKitDatabaseInfoTable__'",[],function(c,d){for(var e=[],f=0;f<d.rows.length;f++)e.push(d.rows.item(f).name);b({db:a,storeNames:e})},function(a,b){c(b)})},function(a){c(a)})})}function ca(a,b){b=k.apply(this,arguments);var c=this.config();a="function"!=typeof a&&a||{},a.name||(a.name=a.name||c.name,a.storeName=a.storeName||c.storeName);var d,e=this;return d=a.name?new va(function(b){var d;d=a.name===c.name?e._dbInfo.db:openDatabase(a.name,"","",0),b(a.storeName?{db:d,storeNames:[a.storeName]}:ba(d))}).then(function(a){return new va(function(b,c){a.db.transaction(function(d){function e(a){return new va(function(b,c){d.executeSql("DROP TABLE IF EXISTS "+a,[],function(){b()},function(a,b){c(b)})})}for(var f=[],g=0,h=a.storeNames.length;g<h;g++)f.push(e(a.storeNames[g]));va.all(f).then(function(){b()}).catch(function(a){c(a)})},function(a){c(a)})})}):va.reject("Invalid arguments"),h(d,b),d}function da(){try{return"undefined"!=typeof localStorage&&"setItem"in localStorage&&!!localStorage.setItem}catch(a){return!1}}function ea(a,b){var c=a.name+"/";return a.storeName!==b.storeName&&(c+=a.storeName+"/"),c}function fa(){var a="_localforage_support_test";try{return localStorage.setItem(a,!0),localStorage.removeItem(a),!1}catch(a){return!0}}function ga(){return!fa()||localStorage.length>0}function ha(a){var b=this,c={};if(a)for(var d in a)c[d]=a[d];return c.keyPrefix=ea(a,b._defaultConfig),ga()?(b._dbInfo=c,c.serializer=Va,va.resolve()):va.reject()}function ia(a){var b=this,c=b.ready().then(function(){for(var a=b._dbInfo.keyPrefix,c=localStorage.length-1;c>=0;c--){var d=localStorage.key(c);0===d.indexOf(a)&&localStorage.removeItem(d)}});return h(c,a),c}function ja(a,b){var c=this;a=j(a);var d=c.ready().then(function(){var b=c._dbInfo,d=localStorage.getItem(b.keyPrefix+a);return d&&(d=b.serializer.deserialize(d)),d});return h(d,b),d}function ka(a,b){var c=this,d=c.ready().then(function(){for(var b=c._dbInfo,d=b.keyPrefix,e=d.length,f=localStorage.length,g=1,h=0;h<f;h++){var i=localStorage.key(h);if(0===i.indexOf(d)){var j=localStorage.getItem(i);if(j&&(j=b.serializer.deserialize(j)),void 0!==(j=a(j,i.substring(e),g++)))return j}}});return h(d,b),d}function la(a,b){var c=this,d=c.ready().then(function(){var b,d=c._dbInfo;try{b=localStorage.key(a)}catch(a){b=null}return b&&(b=b.substring(d.keyPrefix.length)),b});return h(d,b),d}function ma(a){var b=this,c=b.ready().then(function(){for(var a=b._dbInfo,c=localStorage.length,d=[],e=0;e<c;e++){var f=localStorage.key(e);0===f.indexOf(a.keyPrefix)&&d.push(f.substring(a.keyPrefix.length))}return d});return h(c,a),c}function na(a){var b=this,c=b.keys().then(function(a){return a.length});return h(c,a),c}function oa(a,b){var c=this;a=j(a);var d=c.ready().then(function(){var b=c._dbInfo;localStorage.removeItem(b.keyPrefix+a)});return h(d,b),d}function pa(a,b,c){var d=this;a=j(a);var e=d.ready().then(function(){void 0===b&&(b=null);var c=b;return new va(function(e,f){var g=d._dbInfo;g.serializer.serialize(b,function(b,d){if(d)f(d);else try{localStorage.setItem(g.keyPrefix+a,b),e(c)}catch(a){"QuotaExceededError"!==a.name&&"NS_ERROR_DOM_QUOTA_REACHED"!==a.name||f(a),f(a)}})})});return h(e,c),e}function qa(a,b){if(b=k.apply(this,arguments),a="function"!=typeof a&&a||{},!a.name){var c=this.config();a.name=a.name||c.name,a.storeName=a.storeName||c.storeName}var d,e=this;return d=a.name?new va(function(b){b(a.storeName?ea(a,e._defaultConfig):a.name+"/")}).then(function(a){for(var b=localStorage.length-1;b>=0;b--){var c=localStorage.key(b);0===c.indexOf(a)&&localStorage.removeItem(c)}}):va.reject("Invalid arguments"),h(d,b),d}function ra(a,b){a[b]=function(){var c=arguments;return a.ready().then(function(){return a[b].apply(a,c)})}}function sa(){for(var a=1;a<arguments.length;a++){var b=arguments[a];if(b)for(var c in b)b.hasOwnProperty(c)&&($a(b[c])?arguments[0][c]=b[c].slice():arguments[0][c]=b[c])}return arguments[0]}var ta="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},ua=e();"undefined"==typeof Promise&&a(3);var va=Promise,wa="local-forage-detect-blob-support",xa=void 0,ya={},za=Object.prototype.toString,Aa="readonly",Ba="readwrite",Ca={_driver:"asyncStorage",_initStorage:C,_support:f(),iterate:E,getItem:D,setItem:F,removeItem:G,clear:H,length:I,key:J,keys:K,dropInstance:L},Da="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",Ea="~~local_forage_type~",Fa=/^~~local_forage_type~([^~]+)~/,Ga="__lfsc__:",Ha=Ga.length,Ia="arbf",Ja="blob",Ka="si08",La="ui08",Ma="uic8",Na="si16",Oa="si32",Pa="ur16",Qa="ui32",Ra="fl32",Sa="fl64",Ta=Ha+Ia.length,Ua=Object.prototype.toString,Va={serialize:P,deserialize:Q,stringToBuffer:N,bufferToString:O},Wa={_driver:"webSQLStorage",_initStorage:S,_support:M(),iterate:V,getItem:U,setItem:X,removeItem:Y,clear:Z,length:$,key:_,keys:aa,dropInstance:ca},Xa={_driver:"localStorageWrapper",_initStorage:ha,_support:da(),iterate:ka,getItem:ja,setItem:pa,removeItem:oa,clear:ia,length:na,key:la,keys:ma,dropInstance:qa},Ya=function(a,b){return a===b||"number"==typeof a&&"number"==typeof b&&isNaN(a)&&isNaN(b)},Za=function(a,b){for(var c=a.length,d=0;d<c;){if(Ya(a[d],b))return!0;d++}return!1},$a=Array.isArray||function(a){return"[object Array]"===Object.prototype.toString.call(a)},_a={},ab={},bb={INDEXEDDB:Ca,WEBSQL:Wa,LOCALSTORAGE:Xa},cb=[bb.INDEXEDDB._driver,bb.WEBSQL._driver,bb.LOCALSTORAGE._driver],db=["dropInstance"],eb=["clear","getItem","iterate","key","keys","length","removeItem","setItem"].concat(db),fb={description:"",driver:cb.slice(),name:"localforage",size:4980736,storeName:"keyvaluepairs",version:1},gb=function(){function a(b){d(this,a);for(var c in bb)if(bb.hasOwnProperty(c)){var e=bb[c],f=e._driver;this[c]=f,_a[f]||this.defineDriver(e)}this._defaultConfig=sa({},fb),this._config=sa({},this._defaultConfig,b),this._driverSet=null,this._initDriver=null,this._ready=!1,this._dbInfo=null,this._wrapLibraryMethodsWithReady(),this.setDriver(this._config.driver).catch(function(){})}return a.prototype.config=function(a){if("object"===(void 0===a?"undefined":ta(a))){if(this._ready)return new Error("Can't call config() after localforage has been used.");for(var b in a){if("storeName"===b&&(a[b]=a[b].replace(/\W/g,"_")),"version"===b&&"number"!=typeof a[b])return new Error("Database version must be a number.");this._config[b]=a[b]}return!("driver"in a&&a.driver)||this.setDriver(this._config.driver)}return"string"==typeof a?this._config[a]:this._config},a.prototype.defineDriver=function(a,b,c){var d=new va(function(b,c){try{var d=a._driver,e=new Error("Custom driver not compliant; see https://mozilla.github.io/localForage/#definedriver");if(!a._driver)return void c(e);for(var f=eb.concat("_initStorage"),g=0,i=f.length;g<i;g++){var j=f[g];if((!Za(db,j)||a[j])&&"function"!=typeof a[j])return void c(e)}(function(){for(var b=function(a){return function(){var b=new Error("Method "+a+" is not implemented by the current driver"),c=va.reject(b);return h(c,arguments[arguments.length-1]),c}},c=0,d=db.length;c<d;c++){var e=db[c];a[e]||(a[e]=b(e))}})();var k=function(c){_a[d]&&console.info("Redefining LocalForage driver: "+d),_a[d]=a,ab[d]=c,b()};"_support"in a?a._support&&"function"==typeof a._support?a._support().then(k,c):k(!!a._support):k(!0)}catch(a){c(a)}});return i(d,b,c),d},a.prototype.driver=function(){return this._driver||null},a.prototype.getDriver=function(a,b,c){var d=_a[a]?va.resolve(_a[a]):va.reject(new Error("Driver not found."));return i(d,b,c),d},a.prototype.getSerializer=function(a){var b=va.resolve(Va);return i(b,a),b},a.prototype.ready=function(a){var b=this,c=b._driverSet.then(function(){return null===b._ready&&(b._ready=b._initDriver()),b._ready});return i(c,a,a),c},a.prototype.setDriver=function(a,b,c){function d(){g._config.driver=g.driver()}function e(a){return g._extend(a),d(),g._ready=g._initStorage(g._config),g._ready}function f(a){return function(){function b(){for(;c<a.length;){var f=a[c];return c++,g._dbInfo=null,g._ready=null,g.getDriver(f).then(e).catch(b)}d();var h=new Error("No available storage method found.");return g._driverSet=va.reject(h),g._driverSet}var c=0;return b()}}var g=this;$a(a)||(a=[a]);var h=this._getSupportedDrivers(a),j=null!==this._driverSet?this._driverSet.catch(function(){return va.resolve()}):va.resolve();return this._driverSet=j.then(function(){var a=h[0];return g._dbInfo=null,g._ready=null,g.getDriver(a).then(function(a){g._driver=a._driver,d(),g._wrapLibraryMethodsWithReady(),g._initDriver=f(h)})}).catch(function(){d();var a=new Error("No available storage method found.");return g._driverSet=va.reject(a),g._driverSet}),i(this._driverSet,b,c),this._driverSet},a.prototype.supports=function(a){return!!ab[a]},a.prototype._extend=function(a){sa(this,a)},a.prototype._getSupportedDrivers=function(a){for(var b=[],c=0,d=a.length;c<d;c++){var e=a[c];this.supports(e)&&b.push(e)}return b},a.prototype._wrapLibraryMethodsWithReady=function(){for(var a=0,b=eb.length;a<b;a++)ra(this,eb[a])},a.prototype.createInstance=function(b){return new a(b)},a}(),hb=new gb;b.exports=hb},{3:3}]},{},[4])(4)});
//LOCALFORAGE-Starts-With-Extender
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("localforage")):"function"==typeof define&&define.amd?define(["exports","localforage"],t):t(e.localforageStartsWith=e.localforageStartsWith||{},e.localforage)}(this,(function(e,t){"use strict";function n(e){return n.result?n.result:e&&"function"==typeof e.getSerializer?(n.result=e.getSerializer(),n.result):Promise.reject(new Error("localforage.getSerializer() was not available! localforage v1.4+ is required!"))}function r(e,t){t&&e.then((function(e){t(null,e)}),(function(e){t(e)}))}function o(e,t){var n=this.getItem(e).then((function(t){return{key:e,value:t}}));return r(n,t),n}t="default"in t?t.default:t;var i="undefined"!=typeof IDBKeyRange?IDBKeyRange:"undefined"!=typeof webkitIDBKeyRange?webkitIDBKeyRange:"undefined"!=typeof mozIDBKeyRange?mozIDBKeyRange:void 0;function a(e,t){var n=this,o=new Promise((function(t,r){n.ready().then((function(){var o=n._dbInfo,a=o.db.transaction(o.storeName,"readonly").objectStore(o.storeName),c=i.bound(e,e+"uffff",!1,!1),u={},f=a.openCursor(c);f.onsuccess=function(){var e=f.result;if(e){var n=e.value;void 0===n&&(n=null),u[e.key]=n,e.continue()}else t(u)},f.onerror=function(){r(f.error)}})).catch(r)}));return r(o,t),o}function c(e,t){var n=this,o=new Promise((function(t,r){n.ready().then((function(){var o=n._dbInfo,a=o.db.transaction(o.storeName,"readonly").objectStore(o.storeName),c=i.bound(e,e+"uffff",!1,!1),u=[];if("function"==typeof a.getAllKeys){var f=a.getAllKeys(c);f.onsuccess=function(){t(f.result)},f.onerror=function(){r(f.error)}}else{var l=a.openCursor(c);l.onsuccess=function(){var e=l.result;e?(u.push(e.key),e.continue()):t(u)},l.onerror=function(){r(l.error)}}})).catch(r)}));return r(o,t),o}function u(e,t){var o=this,i=new Promise((function(t,r){o.ready().then((function(){return n(o)})).then((function(n){var i=o._dbInfo;i.db.transaction((function(o){o.executeSql("SELECT * FROM "+i.storeName+" WHERE (key LIKE ?)",[e+"%"],(function(e,r){for(var o={},i=r.rows,a=0,c=i.length;a<c;a++){var u=i.item(a),f=u.value;f&&(f=n.deserialize(f)),o[u.key]=f}t(o)}),(function(e,t){r(t)}))}))})).catch(r)}));return r(i,t),i}function f(e,t){var n=this,o=new Promise((function(t,r){n.ready().then((function(){var o=n._dbInfo;o.db.transaction((function(n){n.executeSql("SELECT key FROM "+o.storeName+" WHERE (key LIKE ?)",[e+"%"],(function(e,n){for(var r=[],o=n.rows,i=0,a=o.length;i<a;i++){var c=o.item(i);r.push(c.key)}t(r)}),(function(e,t){r(t)}))}))})).catch(r)}));return r(o,t),o}function l(e,t){var n=this,i=new Promise((function(t,r){n.keys().then((function(i){for(var a=[],c=e.length,u=0,f=i.length;u<f;u++){var l=i[u];l.slice(0,c)===e&&a.push(o.call(n,l))}Promise.all(a).then((function(e){for(var n={},r=0,o=e.length;r<o;r++){var i=e[r];n[i.key]=i.value}t(n)})).catch(r)})).catch(r)}));return r(i,t),i}function s(e,t){var n=this,o=new Promise((function(t,r){n.keys().then((function(n){for(var r=[],o=e.length,i=0,a=n.length;i<a;i++){var c=n[i];c.slice(0,o)===e&&r.push(c)}t(r)})).catch(r)}));return r(o,t),o}function h(e,t){var n=this,r=n.driver();return r===n.INDEXEDDB?a.call(n,e,t):r===n.WEBSQL?u.call(n,e,t):l.call(n,e,t)}function v(e,t){var n=this,r=n.driver();return r===n.INDEXEDDB?c.call(n,e,t):r===n.WEBSQL?f.call(n,e,t):s.call(n,e,t)}function d(e){var t=Object.getPrototypeOf(e);t&&(t.startsWith=h,t.keysStartingWith=v)}var y=d(t);e.localforageStartsWith=h,e.localforageKeysStartingWith=v,e.extendPrototype=d,e.extendPrototypeResult=y,e.startsWithGeneric=l,e.keysStartingWithGeneric=s,Object.defineProperty(e,"__esModule",{value:!0})}));
//AXIOS.MIN.JS
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.axios=t():e.axios=t()}(this,function(){return function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){e.exports=n(1)},function(e,t,n){"use strict";function r(e){var t=new s(e),n=i(s.prototype.request,t);return o.extend(n,s.prototype,t),o.extend(n,t),n}var o=n(2),i=n(3),s=n(4),a=n(22),u=n(10),c=r(u);c.Axios=s,c.create=function(e){return r(a(c.defaults,e))},c.Cancel=n(23),c.CancelToken=n(24),c.isCancel=n(9),c.all=function(e){return Promise.all(e)},c.spread=n(25),e.exports=c,e.exports.default=c},function(e,t,n){"use strict";function r(e){return"[object Array]"===R.call(e)}function o(e){return"undefined"==typeof e}function i(e){return null!==e&&!o(e)&&null!==e.constructor&&!o(e.constructor)&&"function"==typeof e.constructor.isBuffer&&e.constructor.isBuffer(e)}function s(e){return"[object ArrayBuffer]"===R.call(e)}function a(e){return"undefined"!=typeof FormData&&e instanceof FormData}function u(e){var t;return t="undefined"!=typeof ArrayBuffer&&ArrayBuffer.isView?ArrayBuffer.isView(e):e&&e.buffer&&e.buffer instanceof ArrayBuffer}function c(e){return"string"==typeof e}function f(e){return"number"==typeof e}function p(e){return null!==e&&"object"==typeof e}function d(e){if("[object Object]"!==R.call(e))return!1;var t=Object.getPrototypeOf(e);return null===t||t===Object.prototype}function l(e){return"[object Date]"===R.call(e)}function h(e){return"[object File]"===R.call(e)}function m(e){return"[object Blob]"===R.call(e)}function y(e){return"[object Function]"===R.call(e)}function g(e){return p(e)&&y(e.pipe)}function v(e){return"undefined"!=typeof URLSearchParams&&e instanceof URLSearchParams}function x(e){return e.replace(/^\s*/,"").replace(/\s*$/,"")}function w(){return("undefined"==typeof navigator||"ReactNative"!==navigator.product&&"NativeScript"!==navigator.product&&"NS"!==navigator.product)&&("undefined"!=typeof window&&"undefined"!=typeof document)}function b(e,t){if(null!==e&&"undefined"!=typeof e)if("object"!=typeof e&&(e=[e]),r(e))for(var n=0,o=e.length;n<o;n++)t.call(null,e[n],n,e);else for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&t.call(null,e[i],i,e)}function E(){function e(e,n){d(t[n])&&d(e)?t[n]=E(t[n],e):d(e)?t[n]=E({},e):r(e)?t[n]=e.slice():t[n]=e}for(var t={},n=0,o=arguments.length;n<o;n++)b(arguments[n],e);return t}function C(e,t,n){return b(t,function(t,r){n&&"function"==typeof t?e[r]=S(t,n):e[r]=t}),e}function j(e){return 65279===e.charCodeAt(0)&&(e=e.slice(1)),e}var S=n(3),R=Object.prototype.toString;e.exports={isArray:r,isArrayBuffer:s,isBuffer:i,isFormData:a,isArrayBufferView:u,isString:c,isNumber:f,isObject:p,isPlainObject:d,isUndefined:o,isDate:l,isFile:h,isBlob:m,isFunction:y,isStream:g,isURLSearchParams:v,isStandardBrowserEnv:w,forEach:b,merge:E,extend:C,trim:x,stripBOM:j}},function(e,t){"use strict";e.exports=function(e,t){return function(){for(var n=new Array(arguments.length),r=0;r<n.length;r++)n[r]=arguments[r];return e.apply(t,n)}}},function(e,t,n){"use strict";function r(e){this.defaults=e,this.interceptors={request:new s,response:new s}}var o=n(2),i=n(5),s=n(6),a=n(7),u=n(22);r.prototype.request=function(e){"string"==typeof e?(e=arguments[1]||{},e.url=arguments[0]):e=e||{},e=u(this.defaults,e),e.method?e.method=e.method.toLowerCase():this.defaults.method?e.method=this.defaults.method.toLowerCase():e.method="get";var t=[a,void 0],n=Promise.resolve(e);for(this.interceptors.request.forEach(function(e){t.unshift(e.fulfilled,e.rejected)}),this.interceptors.response.forEach(function(e){t.push(e.fulfilled,e.rejected)});t.length;)n=n.then(t.shift(),t.shift());return n},r.prototype.getUri=function(e){return e=u(this.defaults,e),i(e.url,e.params,e.paramsSerializer).replace(/^\?/,"")},o.forEach(["delete","get","head","options"],function(e){r.prototype[e]=function(t,n){return this.request(u(n||{},{method:e,url:t}))}}),o.forEach(["post","put","patch"],function(e){r.prototype[e]=function(t,n,r){return this.request(u(r||{},{method:e,url:t,data:n}))}}),e.exports=r},function(e,t,n){"use strict";function r(e){return encodeURIComponent(e).replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+").replace(/%5B/gi,"[").replace(/%5D/gi,"]")}var o=n(2);e.exports=function(e,t,n){if(!t)return e;var i;if(n)i=n(t);else if(o.isURLSearchParams(t))i=t.toString();else{var s=[];o.forEach(t,function(e,t){null!==e&&"undefined"!=typeof e&&(o.isArray(e)?t+="[]":e=[e],o.forEach(e,function(e){o.isDate(e)?e=e.toISOString():o.isObject(e)&&(e=JSON.stringify(e)),s.push(r(t)+"="+r(e))}))}),i=s.join("&")}if(i){var a=e.indexOf("#");a!==-1&&(e=e.slice(0,a)),e+=(e.indexOf("?")===-1?"?":"&")+i}return e}},function(e,t,n){"use strict";function r(){this.handlers=[]}var o=n(2);r.prototype.use=function(e,t){return this.handlers.push({fulfilled:e,rejected:t}),this.handlers.length-1},r.prototype.eject=function(e){this.handlers[e]&&(this.handlers[e]=null)},r.prototype.forEach=function(e){o.forEach(this.handlers,function(t){null!==t&&e(t)})},e.exports=r},function(e,t,n){"use strict";function r(e){e.cancelToken&&e.cancelToken.throwIfRequested()}var o=n(2),i=n(8),s=n(9),a=n(10);e.exports=function(e){r(e),e.headers=e.headers||{},e.data=i(e.data,e.headers,e.transformRequest),e.headers=o.merge(e.headers.common||{},e.headers[e.method]||{},e.headers),o.forEach(["delete","get","head","post","put","patch","common"],function(t){delete e.headers[t]});var t=e.adapter||a.adapter;return t(e).then(function(t){return r(e),t.data=i(t.data,t.headers,e.transformResponse),t},function(t){return s(t)||(r(e),t&&t.response&&(t.response.data=i(t.response.data,t.response.headers,e.transformResponse))),Promise.reject(t)})}},function(e,t,n){"use strict";var r=n(2);e.exports=function(e,t,n){return r.forEach(n,function(n){e=n(e,t)}),e}},function(e,t){"use strict";e.exports=function(e){return!(!e||!e.__CANCEL__)}},function(e,t,n){"use strict";function r(e,t){!i.isUndefined(e)&&i.isUndefined(e["Content-Type"])&&(e["Content-Type"]=t)}function o(){var e;return"undefined"!=typeof XMLHttpRequest?e=n(12):"undefined"!=typeof process&&"[object process]"===Object.prototype.toString.call(process)&&(e=n(12)),e}var i=n(2),s=n(11),a={"Content-Type":"application/x-www-form-urlencoded"},u={adapter:o(),transformRequest:[function(e,t){return s(t,"Accept"),s(t,"Content-Type"),i.isFormData(e)||i.isArrayBuffer(e)||i.isBuffer(e)||i.isStream(e)||i.isFile(e)||i.isBlob(e)?e:i.isArrayBufferView(e)?e.buffer:i.isURLSearchParams(e)?(r(t,"application/x-www-form-urlencoded;charset=utf-8"),e.toString()):i.isObject(e)?(r(t,"application/json;charset=utf-8"),JSON.stringify(e)):e}],transformResponse:[function(e){if("string"==typeof e)try{e=JSON.parse(e)}catch(e){}return e}],timeout:0,xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN",maxContentLength:-1,maxBodyLength:-1,validateStatus:function(e){return e>=200&&e<300}};u.headers={common:{Accept:"application/json, text/plain, */*"}},i.forEach(["delete","get","head"],function(e){u.headers[e]={}}),i.forEach(["post","put","patch"],function(e){u.headers[e]=i.merge(a)}),e.exports=u},function(e,t,n){"use strict";var r=n(2);e.exports=function(e,t){r.forEach(e,function(n,r){r!==t&&r.toUpperCase()===t.toUpperCase()&&(e[t]=n,delete e[r])})}},function(e,t,n){"use strict";var r=n(2),o=n(13),i=n(16),s=n(5),a=n(17),u=n(20),c=n(21),f=n(14);e.exports=function(e){return new Promise(function(t,n){var p=e.data,d=e.headers;r.isFormData(p)&&delete d["Content-Type"],(r.isBlob(p)||r.isFile(p))&&p.type&&delete d["Content-Type"];var l=new XMLHttpRequest;if(e.auth){var h=e.auth.username||"",m=unescape(encodeURIComponent(e.auth.password))||"";d.Authorization="Basic "+btoa(h+":"+m)}var y=a(e.baseURL,e.url);if(l.open(e.method.toUpperCase(),s(y,e.params,e.paramsSerializer),!0),l.timeout=e.timeout,l.onreadystatechange=function(){if(l&&4===l.readyState&&(0!==l.status||l.responseURL&&0===l.responseURL.indexOf("file:"))){var r="getAllResponseHeaders"in l?u(l.getAllResponseHeaders()):null,i=e.responseType&&"text"!==e.responseType?l.response:l.responseText,s={data:i,status:l.status,statusText:l.statusText,headers:r,config:e,request:l};o(t,n,s),l=null}},l.onabort=function(){l&&(n(f("Request aborted",e,"ECONNABORTED",l)),l=null)},l.onerror=function(){n(f("Network Error",e,null,l)),l=null},l.ontimeout=function(){var t="timeout of "+e.timeout+"ms exceeded";e.timeoutErrorMessage&&(t=e.timeoutErrorMessage),n(f(t,e,"ECONNABORTED",l)),l=null},r.isStandardBrowserEnv()){var g=(e.withCredentials||c(y))&&e.xsrfCookieName?i.read(e.xsrfCookieName):void 0;g&&(d[e.xsrfHeaderName]=g)}if("setRequestHeader"in l&&r.forEach(d,function(e,t){"undefined"==typeof p&&"content-type"===t.toLowerCase()?delete d[t]:l.setRequestHeader(t,e)}),r.isUndefined(e.withCredentials)||(l.withCredentials=!!e.withCredentials),e.responseType)try{l.responseType=e.responseType}catch(t){if("json"!==e.responseType)throw t}"function"==typeof e.onDownloadProgress&&l.addEventListener("progress",e.onDownloadProgress),"function"==typeof e.onUploadProgress&&l.upload&&l.upload.addEventListener("progress",e.onUploadProgress),e.cancelToken&&e.cancelToken.promise.then(function(e){l&&(l.abort(),n(e),l=null)}),p||(p=null),l.send(p)})}},function(e,t,n){"use strict";var r=n(14);e.exports=function(e,t,n){var o=n.config.validateStatus;n.status&&o&&!o(n.status)?t(r("Request failed with status code "+n.status,n.config,null,n.request,n)):e(n)}},function(e,t,n){"use strict";var r=n(15);e.exports=function(e,t,n,o,i){var s=new Error(e);return r(s,t,n,o,i)}},function(e,t){"use strict";e.exports=function(e,t,n,r,o){return e.config=t,n&&(e.code=n),e.request=r,e.response=o,e.isAxiosError=!0,e.toJSON=function(){return{message:this.message,name:this.name,description:this.description,number:this.number,fileName:this.fileName,lineNumber:this.lineNumber,columnNumber:this.columnNumber,stack:this.stack,config:this.config,code:this.code}},e}},function(e,t,n){"use strict";var r=n(2);e.exports=r.isStandardBrowserEnv()?function(){return{write:function(e,t,n,o,i,s){var a=[];a.push(e+"="+encodeURIComponent(t)),r.isNumber(n)&&a.push("expires="+new Date(n).toGMTString()),r.isString(o)&&a.push("path="+o),r.isString(i)&&a.push("domain="+i),s===!0&&a.push("secure"),document.cookie=a.join("; ")},read:function(e){var t=document.cookie.match(new RegExp("(^|;\\s*)("+e+")=([^;]*)"));return t?decodeURIComponent(t[3]):null},remove:function(e){this.write(e,"",Date.now()-864e5)}}}():function(){return{write:function(){},read:function(){return null},remove:function(){}}}()},function(e,t,n){"use strict";var r=n(18),o=n(19);e.exports=function(e,t){return e&&!r(t)?o(e,t):t}},function(e,t){"use strict";e.exports=function(e){return/^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(e)}},function(e,t){"use strict";e.exports=function(e,t){return t?e.replace(/\/+$/,"")+"/"+t.replace(/^\/+/,""):e}},function(e,t,n){"use strict";var r=n(2),o=["age","authorization","content-length","content-type","etag","expires","from","host","if-modified-since","if-unmodified-since","last-modified","location","max-forwards","proxy-authorization","referer","retry-after","user-agent"];e.exports=function(e){var t,n,i,s={};return e?(r.forEach(e.split("\n"),function(e){if(i=e.indexOf(":"),t=r.trim(e.substr(0,i)).toLowerCase(),n=r.trim(e.substr(i+1)),t){if(s[t]&&o.indexOf(t)>=0)return;"set-cookie"===t?s[t]=(s[t]?s[t]:[]).concat([n]):s[t]=s[t]?s[t]+", "+n:n}}),s):s}},function(e,t,n){"use strict";var r=n(2);e.exports=r.isStandardBrowserEnv()?function(){function e(e){var t=e;return n&&(o.setAttribute("href",t),t=o.href),o.setAttribute("href",t),{href:o.href,protocol:o.protocol?o.protocol.replace(/:$/,""):"",host:o.host,search:o.search?o.search.replace(/^\?/,""):"",hash:o.hash?o.hash.replace(/^#/,""):"",hostname:o.hostname,port:o.port,pathname:"/"===o.pathname.charAt(0)?o.pathname:"/"+o.pathname}}var t,n=/(msie|trident)/i.test(navigator.userAgent),o=document.createElement("a");return t=e(window.location.href),function(n){var o=r.isString(n)?e(n):n;return o.protocol===t.protocol&&o.host===t.host}}():function(){return function(){return!0}}()},function(e,t,n){"use strict";var r=n(2);e.exports=function(e,t){function n(e,t){return r.isPlainObject(e)&&r.isPlainObject(t)?r.merge(e,t):r.isPlainObject(t)?r.merge({},t):r.isArray(t)?t.slice():t}function o(o){r.isUndefined(t[o])?r.isUndefined(e[o])||(i[o]=n(void 0,e[o])):i[o]=n(e[o],t[o])}t=t||{};var i={},s=["url","method","data"],a=["headers","auth","proxy","params"],u=["baseURL","transformRequest","transformResponse","paramsSerializer","timeout","timeoutMessage","withCredentials","adapter","responseType","xsrfCookieName","xsrfHeaderName","onUploadProgress","onDownloadProgress","decompress","maxContentLength","maxBodyLength","maxRedirects","transport","httpAgent","httpsAgent","cancelToken","socketPath","responseEncoding"],c=["validateStatus"];r.forEach(s,function(e){r.isUndefined(t[e])||(i[e]=n(void 0,t[e]))}),r.forEach(a,o),r.forEach(u,function(o){r.isUndefined(t[o])?r.isUndefined(e[o])||(i[o]=n(void 0,e[o])):i[o]=n(void 0,t[o])}),r.forEach(c,function(r){r in t?i[r]=n(e[r],t[r]):r in e&&(i[r]=n(void 0,e[r]))});var f=s.concat(a).concat(u).concat(c),p=Object.keys(e).concat(Object.keys(t)).filter(function(e){return f.indexOf(e)===-1});return r.forEach(p,o),i}},function(e,t){"use strict";function n(e){this.message=e}n.prototype.toString=function(){return"Cancel"+(this.message?": "+this.message:"")},n.prototype.__CANCEL__=!0,e.exports=n},function(e,t,n){"use strict";function r(e){if("function"!=typeof e)throw new TypeError("executor must be a function.");var t;this.promise=new Promise(function(e){t=e});var n=this;e(function(e){n.reason||(n.reason=new o(e),t(n.reason))})}var o=n(23);r.prototype.throwIfRequested=function(){if(this.reason)throw this.reason},r.source=function(){var e,t=new r(function(t){e=t});return{token:t,cancel:e}},e.exports=r},function(e,t){"use strict";e.exports=function(e){return function(t){return e.apply(null,t)}}}])});


const subtle = window.crypto.subtle;
const initialServers = window.location.hostname == "localhost" ? [window.location.origin + "/"] : ["https://www.valoria.live/"];
const iceServers = [
  {url: "stun:stun.l.google.com:19302", urls: "stun:stun.l.google.com:19302"},
  {url: "stun:stun2.l.google.com:19302", urls: "stun:stun2.l.google.com:19302"},
  {url: "stun:stun3.l.google.com:19302", urls: "stun:stun3.l.google.com:19302"},
  {url: "stun:stun4.l.google.com:19302", urls: "stun:stu4.l.google.com:19302"},
  {url: "stun:stunserver.org", urls: "stun:stunserver.org"},
  {url: "stun:stun.voiparound.com", urls: "stun:stun.voiparound.com"},
  {url: "stun:stun.voipbuster.com", urls: "stun:stun.voipbuster.com"},
  {url: "stun:stun.voipstunt.com", urls: "stun:stun.voipstunt.com"},
  {urls: "stun:openrelay.metered.ca:80"},
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject"
  }
];


class Valoria {
 
  constructor(){ 
    this.id = null;
    this.verified = false;
    this.ecdsa = {
      publicKey: null,
      privateKey: null,
    };
    this.ecdh = {
      publicKey: null,
      privateKey: null,
    };
    this.users = {};
    this.groups = [];
    this.conns = {};
    this.peers = {};
    this.promises = {};
    this.dimension = {};
    this.dimensions = {};
    this.pastPaths = {};
    this.saving = {}
    this.syncIntervalMs = 1000;
    this.timeOffset = 0;
    this.onJoin = () => {};
    (async () => {
      try {
        await this.loadCredentials();
      } catch(e){
        await this.generateCredentials();
      }
    })()
  }
  
  setup = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      await self.reset();
      if(!self.id || !self.ecdsa.publicKey) return rej();
      if(!self.ownerId) self.ownerId = self.id;
      try {
        await self.loadAllGroups();
        const originUrl = self.servers[jumpConsistentHash(self.id, self.servers.length)];
        await self.connectToServer(originUrl, {origin: true});
        self.url = originUrl + "valoria/peers/" + self.id + "/";
        let pathUrl = self.url.replace(/\//g, "");
        self.pathUrl = pathUrl.replace(/\:/g, "");
        self.originUrl = originUrl;
        self.public.url = self.url;
        console.log("origin set;")
        await self.joinGroup();
        await self.sharePublic();
        await self.syncGroupData();
        const stall = Math.abs((self.sync + self.syncIntervalMs) - self.now());
        setTimeout(async () => {
          await self.syncInterval();
        }, self.sync == self.start ? 0 : stall > 0 ? stall : 0)
        self.onJoin();
        console.log("setup");
        res();
      } catch(e){
        console.log(e)
      }
      res();
    })
  }

  signIn = async (id, password) => {
    const self = this;
    return new Promise(async(res, rej) => {

      res();
    })
  }

  loadCredentials = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        let creds = await localforage.getItem("ValoriaCredentials");
        let password = await localforage.getItem("ValoriaPassword");
        if(creds) creds = JSON.parse(creds);
        let ecdhPairToSave = creds.ecdh;
        let ecdsaPairToSave = creds.ecdsa;
        const ecdhPrivData = ecdhPairToSave.privateKey;
        const ecdsaPrivData = ecdsaPairToSave.privateKey;
        let ecdhSalt = base64ToArrayBuffer(ecdhPrivData.salt);
        let ecdhIv = base64ToArrayBuffer(ecdhPrivData.iv);
        let ecdsaSalt = base64ToArrayBuffer(ecdsaPrivData.salt);
        let ecdsaIv = base64ToArrayBuffer(ecdsaPrivData.iv);
        const encryptKey = await window.crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(password),
          {name: "PBKDF2"},
          false,
          ["deriveBits", "deriveKey"]
        );
        const ecdhPrivUnwrappingKey = await getKeyGCM(encryptKey, ecdhSalt);
        const ecdsaPrivUnwrappingKey = await getKeyGCM(encryptKey, ecdsaSalt)
        const ecdhPubKey = await window.crypto.subtle.importKey(
          "raw", base64ToArrayBuffer(ecdhPairToSave.publicKey), { name: "ECDH", namedCurve: "P-384"}, true, []
        )
        const ecdhPrivKey = await window.crypto.subtle.unwrapKey(
          "jwk", base64ToArrayBuffer(ecdhPrivData.wrapped),
          ecdhPrivUnwrappingKey, {name: "AES-GCM", iv: ecdhIv}, { name: "ECDH", namedCurve: "P-384"},  
          true, ["deriveKey", "deriveBits"]
        );
        const ecdsaPubKey = await window.crypto.subtle.importKey(
          "raw", base64ToArrayBuffer(ecdsaPairToSave.publicKey), { name: "ECDSA", namedCurve: "P-384"}, true, ["verify"]
        )
        const ecdsaPrivKey = await window.crypto.subtle.unwrapKey(
          "jwk", base64ToArrayBuffer(ecdsaPrivData.wrapped),
          ecdsaPrivUnwrappingKey, {name: "AES-GCM", iv: ecdsaIv}, { name: "ECDSA", namedCurve: "P-384"},  
          true, ["sign"]
        );
        const ecdsaPubHash = await crypto.subtle.digest("SHA-256", base64ToArrayBuffer(ecdsaPairToSave.publicKey));
        const userId = buf2hex(ecdsaPubHash).substr(24, 64)
        self.ecdh = {publicKey: ecdhPubKey, privateKey: ecdhPrivKey},
        self.ecdsa = {publicKey: ecdsaPubKey, privateKey: ecdsaPrivKey},
        self.id = userId;
        self.public = {
          ecdsaPub: ecdsaPairToSave.publicKey,
          ecdhPub: ecdhPairToSave.publicKey,
          id: self.id,
        }
        self.path = `valoria/data/accounts/${self.id}/`;
        await self.setup();
        res();
      } catch(e){
        console.log(e)
        rej();
      }
    })
  }

  generateCredentials = async (password="") => {
    const self = this;
    return new Promise(async(res, rej) => {
      self.ecdsa = await window.crypto.subtle.generateKey(
        {name: "ECDSA", namedCurve: "P-384"}, true, ["sign", "verify"]
      );
      self.ecdh = await window.crypto.subtle.generateKey(
        {name: "ECDH", namedCurve: "P-384"}, true, ["deriveKey", "deriveBits"]
      );
      const ecdsaPubHash = await crypto.subtle.digest("SHA-256", await window.crypto.subtle.exportKey("raw", self.ecdsa.publicKey));
      self.id = buf2hex(ecdsaPubHash).substr(24, 64)
      const ecdsaSalt = window.crypto.getRandomValues(new Uint8Array(16))
      const ecdsaIv = window.crypto.getRandomValues(new Uint8Array(12))
      const ecdhSalt = window.crypto.getRandomValues(new Uint8Array(16))
      const ecdhIv = window.crypto.getRandomValues(new Uint8Array(12));
      self.secret = await arrayBufferToBase64(window.crypto.getRandomValues(new Uint8Array(32)));
      const encryptKey = await window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password + self.secret),
        {name: "PBKDF2"},
        false,
        ["deriveBits", "deriveKey"]
      );
      let ecdhToSave = {}
      let ecdsaToSave = {}
      const ecdsaPrivWrapped = await wrapCryptoKeyGCM(self.ecdsa.privateKey, ecdsaSalt, encryptKey, ecdsaIv);
      ecdsaToSave.publicKey = await arrayBufferToBase64(await window.crypto.subtle.exportKey("raw", self.ecdsa.publicKey));
      ecdsaToSave.privateKey = {
        wrapped : ecdsaPrivWrapped,
        salt: await arrayBufferToBase64(ecdsaSalt),
        iv: await arrayBufferToBase64(ecdsaIv)
      };
      const ecdhPrivWrapped = await wrapCryptoKeyGCM(self.ecdh.privateKey, ecdhSalt, encryptKey, ecdhIv);
      ecdhToSave.publicKey = await arrayBufferToBase64(await window.crypto.subtle.exportKey("raw", self.ecdh.publicKey));
      ecdhToSave.privateKey = {
        wrapped : ecdhPrivWrapped,
        salt: await arrayBufferToBase64(ecdhSalt),
        iv: await arrayBufferToBase64(ecdhIv)
      };
      await localforage.setItem("ValoriaCredentials", JSON.stringify({
        id: self.id,
        ecdsa: ecdsaToSave,
        ecdh: ecdhToSave
      }));
      await localforage.setItem("ValoriaPassword", password + self.secret);
      self.public = {
        ecdsaPub: ecdsaToSave.publicKey,
        ecdhPub: ecdhToSave.publicKey,
        id: self.id,
      }
      self.path = `valoria/data/accounts/${self.id}/`;
      await self.setup();
      res(self);
    })
  }

  setLocal = async (path, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        if(typeof data == "object"){
          data =  JSON.stringify(data, null, 2);
        }
        await localforage.setItem(`${self.path}${path}`, data)
      } catch(e){

      }
      res();
    })
  }

  getLocal = (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        let data = await localforage.getItem(`${self.path}${path}`);
        try {
          data = JSON.parse(data);
        } catch(e){
        }
        res(data);
      } catch (e){
        res(null);
      }
    });
  }

  get = async (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const groupIndex = jumpConsistentHash(path, self.groups.length);
        // if(groupIndex == self.group.index){
          const data = self.saving[self.sync]["all/" + path] || await self.getLocal("all/" + path);
          if(data){
            return res(data);
          }
        // }
        const members = [...self.groups[groupIndex]]
        if(members.indexOf(self.url) !== -1) members.splice(members.indexOf(self.url), 1);
        if(members.length == 0) return res();
        const url = members[members.length * Math.random() << 0];
        await self.connectToServer(url);
        const now = self.now();
        self.promises["Got data from " + url + " for " + path + " at " + now] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get",
          data: {
            path,
            group: self.group.index,
            now
          }
        }))
      } catch(e){
        return res();
      }
    })
  }

  set = async (path, data, opts={}) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.group) return res();
      try {
        console.log("Creating set request?")
        await self.createSetRequest(path, data);
        console.log("set request created")
        const groupIndex = jumpConsistentHash("data/" + path, self.groups.length);
        if(groupIndex == self.group.index){
          await self.setLocal("all/data/" + path, data);
          for(let i=0;i<self.group.members.length;i++){
            try {
              if(self.group.members[i] == self.url) continue;
              await new Promise(async (res, rej) => {
                await self.connectToServer(self.group.members[i]);
                self.promises["Group sot for data/" + path + " from " + self.group.members[i]] = {res, rej};
                self.conns[self.group.members[i]].send(JSON.stringify({
                  event: "Group set",
                  data: {
                    path: "data/" + path,
                    data: data
                  }
                }));
              })         
            } catch(e){
              console.log(e)
            }
          }
          console.log("Group set")
          try {
            await self.claimValorForData(path);
            return res();
          } catch(e){
            return res();
          }
        } else {
          const members = self.groups[groupIndex];
          const url = members[members.length * Math.random() << 0];
          await self.connectToServer(url);
          self.promises["Set data from " + url + " for " + path] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "Set",
            data: {
              path,
              data,
              group: self.group.index
            }
          }))
        }
      } catch(e){
        return rej(e);
      }
    })
  }

  createSetRequest = async (path, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.group) return rej();
      try {
        const groupIndex = jumpConsistentHash("requests/" + path, self.groups.length);
        const dataHashSig = await self.sign(JSON.stringify(data));
        const dataHash64 = await arrayBufferToBase64(dataHashSig)
        const request = {
          from: self.id,
          url: self.url,
          path,
          data: dataHash64,
          group: self.group.index,
          sync: self.sync
        }
        if(groupIndex == self.group.index){
          const d = await self.getLocal("all/requests/" + path);
          if(d && d.from == request.from) {
            try {
              await self.verify(JSON.stringify(data), base64ToArrayBuffer(d.data), self.ecdsa.publicKey);
              return rej()
            } catch(e){
            }
          };
          await self.setLocal("all/requests/" + path, request);
          for(let i=0;i<self.group.members.length;i++){
            try {
              if(self.group.members[i] == self.url) continue;
              await new Promise(async (res, rej) => {
                await self.connectToServer(self.group.members[i]);
                self.promises["Group sot for requests/" + path + " from " + self.group.members[i]] = {res, rej};
                self.conns[self.group.members[i]].send(JSON.stringify({
                  event: "Group set",
                  data: {
                    path: "requests/" + path,
                    data: request
                  }
                }));
              })              
            } catch(e){
              console.log(e)
            }
          }
          return res();
        } else {
          const members = self.groups[groupIndex];
          const url = members[members.length * Math.random() << 0];
          await self.connectToServer(url);
          self.promises["Sent request to " + url + " for " + path] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "Set request",
            data: {
              request
            }
          }))
        }
      } catch(e){
        return rej();
      }
    })
  }

  getSetRequest = async (path) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const groupIndex = jumpConsistentHash("requests/" + path, self.groups.length);
        const data = await self.getLocal("all/requests/" + path);
        if(data) return res(data);
        const group = [...self.groups[groupIndex]];
        if(group.indexOf(self.url) !== -1) group.splice(group.indexOf(self.url), 1);
        if(group.length == 0) {
          return res();
        }
        const url = group[group.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Got set request from " + url + " for " + path] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get set request",
          data: {
            path,
            group: self.group.index
          }
        }))
      } catch(e){
        return res();
      }
    })
  }

  getValorPath = async (path, id) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const groupIndex = jumpConsistentHash(`valor/${id}/${path}`, self.groups.length);
        // if(groupIndex == self.group.index){
          const data = await self.getLocal(`all/valor/${id}/${path}`);
          if(groupIndex == self.group.index && !data){
            console.log("COULD NOT FIND VALOR FOR PATH " + `all/valor/${id}/${path}`);
          }
          if(data) return res(data);
        // }
        const group = [...self.groups[groupIndex]];
        if(group.indexOf(self.url) !== -1) group.splice(group.indexOf(self.url), 1);
        const url = group[group.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["Got valor path " + path + " from " + url + " for " + id] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get valor path",
          data: {
            path,
            id: id,
            group: self.group.index
          }
        }))
      } catch(e){
        return res();
      }
     
    })
  }

  getLedger = async (id) => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const groupIndex = jumpConsistentHash("ledgers/" + id + ".json", self.groups.length);
        if(groupIndex == self.group.index){
          const data = await self.getLocal("all/ledgers/" + id + ".json");
          return res(data);
        } else {
          const members = self.groups[groupIndex]
          const url = members[members.length * Math.random() << 0];
          await self.connectToServer(url);
          self.promises["Got ledger " + id + " from " + url] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "Get ledger",
            data: {
              id,
              group: self.group.index
            }
          }))
        }
      } catch(e){
        return res();
      }
    })
  }

  startMediaStream = async(opts) => {
    const self = this;
    return new Promise(async(res, rej) => {
      self.stream = await navigator.mediaDevices.getUserMedia(opts);
      res();
    })
  }

  loadAllGroups = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!initialServers || initialServers.length == 0) rej("No initial servers found.");
      try {
        if(!initialServers || initialServers.length == 0) rej("No initial servers found.");
        let servers = [...initialServers];
        let askAmount = 10;
        let askCount = 0
        let used = [];
        let startClaims = [];
        let syncClaims = [];
        while(askCount < askAmount){
          if(servers.length < 1){
            break;
          }
          const url = servers[servers.length * Math.random() << 0];
          if(url.includes("valoria/peers/")){
            servers.splice(servers.indexOf(url), 1);
          } else {
            const data = await new Promise(async (res, rej) => {
              console.log(url)
              await self.connectToServer(url);
              self.promises["Got groups from " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Get groups"
              }));
            })
            // delete self.conns[url];
            const groups = data.groups;
            startClaims.push(data.start);
            syncClaims.push(data.sync);
            if(groups.length > self.groups.length){
              self.groups = [...groups];
              self.syncGroups = [...groups];
            }
            used.push(url);
            servers = self.groups.flat();
            for(let i=0;i<used.length;i++){
              if(servers.indexOf(used[i]) !== -1){
                servers.splice(servers.indexOf(used[i]), 1);
              }
            }
            askCount += 1;
          }
        }
        self.start = mode(startClaims)
        self.sync = mode(syncClaims)
        self.nextSync = self.sync + self.syncIntervalMs;
        self.saving[self.sync] = {};
        let all = self.groups.flat();
        self.servers = [];
        for(let i=0;i<all.length;i++){
          if(!all[i].includes("/valoria/peers/")) self.servers.push(all[i]);
        }
        res();
      } catch(e){
        return rej();
      }
    })
  }

  connectToServer(url, opts={}){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(self.conns[url] && (self.conns[url].readyState === WebSocket.OPEN || self.conns[url].open)){
          if(!self.conns[url].verified && self.url && self.originUrl !== url){
            await new Promise(async(res, rej) => {
              self.promises["Url verified with " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Verify url request",
                data: {
                  url: self.url
                }
              }))
            })
          }
          if(!self.conns[url].verified && opts.origin){
            await new Promise(async(res, rej) => {
              self.promises["Origin url set with " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Set origin url",
                data: {
                  id: self.id
                }
              }))
            })
            self.conns[url].verified = true;
          }
          return res();
        } else {
          if(!self.conns[url]) {
            try {
              if(url.includes("valoria/peers/")){
                console.log("connecting to peer: " + url);
                self.conns[url] = await self.connectToPeer(url);
                console.log("connected");
                self.conns[url].isP2P = true;
                self.conns[url].isWS = false;
                self.conns[url].Url = url;
                return res();
              } else {
                let wsUrl = "ws://" + new URL(url).host + "/"
                if(url.startsWith('https')){
                  wsUrl = "wss://" + new URL(url).host + "/"
                }
                self.conns[url] = new WebSocket(wsUrl);
                self.conns[url].isWS = true;
                self.conns[url].isP2P = false;
                self.conns[url].Url = url;
              }
            } catch(e){
              console.log(e)
            }
          } 
          if(self.conns[url].isWS){
            this.conns[url].onopen = ( async () => {
              try {
                await this.setupWS(this.conns[url]);
                if(opts.origin){
                  await new Promise(async(res, rej) => {
                    self.promises["Origin url set with " + url] = {res, rej};
                    self.conns[url].send(JSON.stringify({
                      event: "Set origin url",
                      data: {
                        id: self.id
                      }
                    }))
                  })
                  self.conns[url].verified = true;
                }
                else if(self.url && url !== self.originUrl){
                  await new Promise(async(res, rej) => {
                    self.promises["Url verified with " + url] = {res, rej};
                    self.conns[url].send(JSON.stringify({
                      event: "Verify url request",
                      data: {
                        url: self.url
                      }
                    }))
                  })
                }
                return res();
              } catch (e){
                // console.log(e)
                res();
              }
            });
            this.conns[url].onerror = (error) => {
              rej(error);
            }
          }
        }
      } catch(e){
        console.log("Could not connect to " + url)
        rej();
      }
    })
  }

  joinGroup = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      const groups = [...self.groups];
      let willCreateGroup = true;
      while(groups.length > 0 && !self.group){
        const gIndex = groups.length * Math.random() << 0
        const group = groups[gIndex];
        const url = group[group.length * Math.random() << 0];
        groups.splice(gIndex, 1);
        try {
          self.group = await new Promise(async(res, rej) => {
            try {
              await self.connectToServer(url);
              self.promises["Joined group from " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Join group",
              }));
            } catch(e){
              // console.log(e)
            }
          });
          willCreateGroup = false;
          console.log(self.url + " has joined group " + self.group.index);
          self.groups[self.group.index] = self.group.members;
          self.conns[url].send(JSON.stringify({
            event: "Joined group success"
          }));
          await self.syncTimeWithNearby();
        } catch (e){
          continue;
        }
      }
      if(willCreateGroup){
        try {
          await self.requestNewGroup();
          await self.createGroup();
        } catch (e){
          await self.loadAllGroups();
          await self.joinGroup();
        }
      }
      return res();
    });
  }


  requestNewGroup(){
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        await self.loadAllGroups();
        const groupIndex = self.groups.length;
        if(groupIndex == 0) return res();
        if(self.groups[groupIndex]) return rej()
        const group = self.groups[self.groups.length * Math.random() << 0];
        const url = group[group.length * Math.random() << 0];
        await self.connectToServer(url);
        self.promises["New group response from " + url] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Request new group",
          data: {
            index: groupIndex
          }
        }));
      } catch(e){
        rej();
      }
    })
  }

  createGroup = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      const now = self.now();
      try {
        self.group = {
          index : self.groups.length,
          members: [self.url],
          version: 0,
          updated: now,
          max: 3
        }
        self.groups.push([self.url]);
        if(self.group.index > 0){
          const url = self.groups[self.group.index - 1][self.groups[self.group.index - 1]?.length * Math.random() << 0];
          await new Promise(async(res, rej) => {
            await self.connectToServer(url);
            self.promises["New group found at " + url] = {res, rej};
            self.conns[url].send(JSON.stringify({
              event: "New group",
              data: {
                group: self.group
              }
            }));
          })
        } else if(self.group.index == 0){
          // self.start = now;
          // self.sync = self.start;
          // self.nextSync = self.sync + self.syncIntervalMs;
        }
        await self.syncTimeWithNearby();
        // await self.setLocal("group.json", self.group);
        // await self.setLocal("groups.json", self.groups);
        console.log(self.url + " has created group " + self.group.index);
        return res(true);
      } catch (e){
        rej();
      }
    })
  }

  claimValorForData = async (path) => {
    const self = this;
    return new Promise(async (res, rej) => {
      console.log("claim valor for " + path);
      try {
        if(!self.group || self.groups.length <= 0) return res();
        const valorGroupIndex = jumpConsistentHash(`valor/${self.ownerId}/${path}`, self.groups.length);
        const sync = self.sync;
        if(valorGroupIndex == self.group.index){ 
          console.log("My group responsible");
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            await new Promise(async (res, rej) => {
              self.promises["Claimed valor for path " + path + " from " + self.group.members[i]] = {res, rej};
              self.conns[self.group.members[i]].send(JSON.stringify({
                event: "Claim valor for path",
                data: {
                  path,
                  id: self.ownerId,
                  url: self.url,
                  sync
                }
              }));
            })
          }
          console.log("My group claimed");
          const request = await self.get("requests/" + path);
          if(!request) throw "No request";
          let publicD = await self.getPublicFromUrl(request.url);
          if(!publicD) throw "No public data for requester";
          const dataGroupIndex = jumpConsistentHash("data/" + path, self.groups.length);
          if(dataGroupIndex !== self.group.index) return res()
          const data = await self.getLocal("all/data/" + path);
          const size = new TextEncoder().encode(JSON.stringify(data)).length;
          try {
            await self.verify(JSON.stringify(data), base64ToArrayBuffer(request.data), publicD.ecdsaPub);
          } catch(e){
            console.log(data);
            throw e;
          }
          console.log("Valor is valid");
          let valor = self.saving[self.sync][`all/valor/${self.ownerId}/${path}`] || await self.get(`valor/${self.ownerId}/${path}`);
          if(valor && valor.data && valor.sigs && valor.data.for == self.ownerId && valor.data.path == path && valor.data.time?.length > 0){
            if(valor.data.size !== size){
              valor.data.size = size;
              delete valor.sigs;
              valor.sigs = {};
            }
            if(valor.data.time[valor.data.time.length - 1].length == 2){
              valor.data.time.push([sync]);
              delete valor.sigs;
              valor.sigs = {};
            }
          } else {
            valor = {
              data: {
                for: self.ownerId,
                url: self.url,
                path: path,
                size,
                sync,
                time: [[sync]]
              },
              sigs : {}
            }
          }
          valor.sigs[self.url] = await arrayBufferToBase64(await self.sign(JSON.stringify(valor)))
          self.saving[self.sync][`all/valor/${self.ownerId}/${path}`] = valor;
          await self.setLocal(`all/valor/${self.ownerId}/${path}`, valor);
          console.log("sharing group sig");
          await self.shareGroupSig(`valor/${self.ownerId}/${path}`);
          console.log("Valor is saved");
          await self.addPathToLedger(path);
        } else {  
          for(let i=0;i<self.groups[valorGroupIndex].length;i++){
            const url = self.groups[valorGroupIndex][i];
            if(self.promises["Claimed valor for path " + path + " from " + url]) continue;
            await self.connectToServer(url);
            await new Promise(async (res, rej) => {
              self.promises["Claimed valor for path " + path + " from " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Claim valor for path",
                data: {
                  path,
                  id: self.ownerId,
                  url: self.url,
                  sync
                }
              }));
            })
          }
          console.log("Other group verified my valor");
          await self.addPathToLedger(path); 
        }
      } catch(e){
        console.log(e);
      }
      return res();
    })
  }

  updateValorClaims = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      const keys = await localforage.keysStartingWith(`${self.path}all/valor`);
      let paths = [];
      for(let i=0;i<keys.length;i++){
        paths.push(keys[i].substr(`${self.path}all/`.length))
      }
      for(let i=0;i<paths.length;i++){
        const valor = self.saving[self.sync][`all/${paths[i]}`] || await self.get(`${paths[i]}`);
        if(!valor || !valor.data) continue;
        if(valor.data.time[valor.data.time.length - 1].length == 1){
          const valorGroupIndex = jumpConsistentHash("data/" + valor.data.path, self.groups.length);
          if(self.groups[valorGroupIndex].indexOf(valor.data.url) == -1){
            valor.data.time[valor.data.time.length - 1].push(self.nextSync);
            self.saving[self.sync][`all/${paths[i]}`] = valor;
            await self.setLocal(`all/${paths[i]}`, valor);
            // console.log(valor.data);
          }
        }
      }
      return res();
    });
  }

  addPathToLedger = async (path) => {
    const self = this;
    return new Promise(async (res, rej) => {
      console.log("adding path to ledger: " + path);
      try {
        const ledgerGroupIndex = jumpConsistentHash("ledgers/" + self.ownerId + ".json", self.groups.length);
        const ledgerGroup = [...self.groups[ledgerGroupIndex]];
        console.log(ledgerGroupIndex + " is adding to ledger");
        for(let i=0;i<ledgerGroup.length;i++){
          const url = ledgerGroup[i];
          if(url !== self.url){
            try {
              if(self.promises[`Path ${path} added to ledger ${self.ownerId} from ${url}`]) continue;
              await self.connectToServer(url);
              await new Promise(async(res, rej) => {
                self.promises[`Path ${path} added to ledger ${self.ownerId} from ${url}`] = {res, rej};
                self.conns[url].send(JSON.stringify({
                  event: "Add path to ledger",
                  data: {
                    id: self.ownerId,
                    path
                  }
                }))
              })
            }catch(e){

            }
          } else {
            console.log("I must add to ledger");
            try {
              const valorGroupIndex = jumpConsistentHash(`valor/${self.ownerId}/${path}`, self.groups.length);
              const valorGroup = self.groups[valorGroupIndex];
              let valor;
              let isValid = true;
              for(let j=0;j<valorGroup.length;j++){
                const url = valorGroup[j];
                let v;
                if(url == self.url) {
                  v = await self.getLocal(`all/valor/${self.ownerId}/${path}`);
                } else {
                  try {
                    v = await new Promise(async(res, rej) => {
                      await self.connectToServer(url);
                      self.promises["Got valor path " + path + " from " + url + " for " + self.ownerId] = {res, rej};
                      self.conns[url].send(JSON.stringify({
                        event: "Get valor path",
                        data: {
                          path,
                          id: self.ownerId,
                          group: self.group.index
                        }
                      }))
                    })
                  } catch(e){
                  }
                }
                if(!valor && v) {
                  valor = JSON.stringify(v.data);
                } else if(v && valor !== JSON.stringify(v.data)){
                  isValid = false;
                  break;
                }
              }
              if(isValid){
                console.log("Valor is valid for ledger");
                let d = self.saving[self.sync]["all/ledgers/" + self.ownerId + ".json"] || await self.getLocal("all/ledgers/" + self.ownerId + ".json");
                if(!d || !d.data) {
                  d = {
                    data: {
                      paths: {},
                      for: self.ownerId,
                    },
                    sigs: {}
                  }
                }
                if(!d.data.paths[path]){
                  d.data.paths[path] = 1;
                  delete d.sigs;
                  d.sigs = {};
                  d.sigs[self.url] = await arrayBufferToBase64(await self.sign(JSON.stringify(d.data)))
                  self.saving[self.sync]["all/ledgers/" + self.ownerId + ".json"] = d;
                  await self.setLocal("all/ledgers/" + self.ownerId + ".json", d);
                  console.log("sharing group sig");
                  await self.shareGroupSig("ledgers/" + self.ownerId + ".json");
                  console.log("added to ledger")
                } else {
                  console.log("Ledger path already exists");
                }
              }
            } catch(e){
              console.log(e)
            }
          }
        }  
        console.log("ledger added success!"); 
        return res()   
      } catch(e){
        return res();
      }
    })
  }

  calculateValor = async (id) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(id.startsWith('http')){
        const publicD = await self.getPublicFromUrl(id);
        id = publicD.id;
      }
      try {
        const ledger = await self.getLedger(id);
        if(!ledger || !ledger.sigs) {
          // console.log("LEDGER NOT FOUND FOR " + id);
          return res(0)
        };
        const sigUrls = Object.keys(ledger.sigs);
        for(let i=0;i<sigUrls.length;i++){
          try {
            const ledgerPublic = await self.getPublicFromUrl(sigUrls[i]);
            await self.verify(JSON.stringify(ledger.data), base64ToArrayBuffer(ledger.sigs[sigUrls[i]]), ledgerPublic.ecdsaPub);
          } catch(e){
            // console.log(Buffer.from(ledger.sigs[sigUrls[i]]));
            console.log(e)
            throw e;
          }
        }
        let valor = 0;
        const sync = self.sync || self.start;
        const paths = Object.keys(ledger.data.paths);
        for(let i=0;i<paths.length;i++){
          try {
            const v = self.saving[self.sync][`all/valor/${id}/${paths[i]}`] || await self.get(`valor/${id}/${paths[i]}`);
            if(!v || !v.data) continue;
            const duration = self.getDuration(v.data.time);
            const amount = ((v.data.size / 10000000) * (duration / 1000000000 )) + (duration * 0.0000000005);
            valor += amount;
          } catch(e){
            continue;
          }
        }
        res(+valor.toFixed(12));
      } catch(e){
        rej(e);
      }
    })
  }

  getDuration(timeArr){
    const self = this;
    let dur = 0;
    for(let i=0;i<timeArr.length;i++){
      if(timeArr[i].length == 2){
        dur += Math.abs(timeArr[i][1] - timeArr[i][0]);
      }else if(timeArr[i].length == 1){
        dur += Math.abs(self.nextSync - timeArr[i][0]);
      }
    }
    return dur;
  }

  async syncPing(ws){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const resp = await new Promise(async (res, rej) => {
          const start = self.now();
          ws.send(JSON.stringify({
            event: "Sync ping",
            data: {
              start
            }
          }))
          self.promises["Pong from " + ws.Url + " at " + start] = {res, rej};
        })
        resp.roundTrip = resp.end - resp.start;
        resp.latency = resp.roundTrip / 2;
        resp.offset = resp.pingReceived - resp.end + resp.latency;
        return res(resp)
      } catch(e){
        return rej();
      }
    })
  }

  syncTimeWithNearby = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        let offsets = [];
        if(!self.group) return res();
        for(let i=0;i<self.group.members.length;i++){
          try {
            const url = self.group.members[i];
            if(url == self.url) continue;
            await self.connectToServer(url);
            const ping = await self.syncPing(self.conns[url]);
            offsets.push(ping.offset);
          } catch(e){

          }
        }
        // if(self.group.index > 0 && self.groups[self.group.index - 1]?.length > 0){
        //   try {
        //     const url = self.groups[self.group.index - 1][self.groups[self.group.index - 1]?.length * Math.random() << 0];
        //     await self.connectToServer(url);
        //     const ping = await self.syncPing(self.conns[url]);
        //     offsets.push(ping.offset);
        //   } catch(e){

        //   }
        // }
        // if(self.groups[self.group.index + 1]?.length > 0){
        //   try {
        //     const url = self.groups[self.group.index + 1][self.groups[self.group.index + 1]?.length * Math.random() << 0];
        //     await self.connectToServer(url);
        //     const ping = await self.syncPing(self.conns[url]);
        //     offsets.push(ping.offset);
        //   } catch (e){
        //   }
        // }
        if(offsets.length > 0){
          self.timeOffset += offsets.reduce((a, b) => a + b) / offsets.length;
        }
        res();
      } catch(e){
        console.log(e);
        res();
      }
      
    })
  };

  syncInterval = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.now() >= self.nextSync || self.sync == self.start){
        self.saving[self.sync] = {};
        self.syncGroup = Object.assign({}, self.group);
        self.syncGroups = [...self.groups];
        // await self.saveGroups();
      }
      res();
      const main = setInterval(async () => {
        if(!self.saving[self.sync]) self.saving[self.sync] = {};
        self.syncGroup = Object.assign({}, self.group);
        self.syncGroups = [...self.groups];
        try {
          await self.syncTimeWithNearby();
          // await self.saveGroups();
          // await self.sharePublic();
          // await self.syncGroupData();
          // await self.updateValorClaims();
          // await self.reassignGroupData();
        } catch(e){
          
        }
        delete self.saving[self.sync - (self.syncIntervalMs * 2)];
        self.sync = self.nextSync;
        self.nextSync += self.syncIntervalMs;
        self.saving[self.sync] = {};

        //VALOR TESTS
        // if(self.url == 'http://localhost:3000/'){
        // console.log(self.groups);
        // for(let i=0;i<self.groups.length;i++){
        //   for(let j=0;j<self.groups[i].length;j++){
        //     try {
        //       const valor = await self.calculateValor(self.groups[i][j]);
        //       console.log(`${self.groups[i][j]} Valor: ${valor}`);
        //     } catch(e){
        //       console.log(e)
        //     } 
        //   }
        // }
        // console.log("\n\n")

      }, self.syncIntervalMs);
    })
  }

  saveGroups = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      const path = `groups/${self.sync}.json`;
      const group = jumpConsistentHash("data/" + path, self.syncGroups.length);
      if(self.syncGroup && group == self.syncGroup.index){
        const d = {
          data: {
            groups: self.syncGroups,
            sync: self.sync
          },
          sigs: {}
        };
        d.sigs[self.url] = await arrayBufferToBase64(await self.sign(JSON.stringify(d.data)));
        self.saving[self.sync]["all/" + path] = d;
        await self.setLocal("all/" + path, d);
        await self.shareGroupSig(path);
      }
      res();
    });
  }

  shareGroupSig = async (path) => {
    const self = this;
    return new Promise(async (res, rej) => {
      const d = self.saving[self.sync]["all/" + path] || self.getLocal("all/" + path);
      if(!d || !d.sigs || !d.sigs[self.url]) return res();
      for(let i=0;i<self.group.members.length;i++){
        const url = self.group.members[i];
        if(url == self.url) continue;
        console.log("asking sig from: " + url);
        const sig = await new Promise(async (res, rej) => {
          await self.connectToServer(url);
          self.promises["Got group sig for " + path + " from " + url] = {res, rej};
          self.conns[url].send(JSON.stringify({
            event: "Share group sig",
            data: {
              path,
              sig: d.sigs[self.url]
            }
          }));
        })
        if(!sig) continue;
        console.log("Got sig");
        const publicD = await self.getPublicFromUrl(url);
        if(!publicD || !publicD.ecdsaPub) continue;
        console.log("Got public");
        try {
          await self.verify(JSON.stringify(d.data), base64ToArrayBuffer(sig), publicD.ecdsaPub);
          d.sigs[ws.Url] = data.sig;
          d.sigs[url] = sig;
          self.saving[self.sync]["all/" + path] = d;
          await self.setLocal("all/" + path, d);
        } catch(e){
          continue;
        }
      }
      return res();
    })
  }

  sharePublic = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        await self.set(`${self.id}/public.json`, self.public);
        await self.set(`${self.pathUrl}/public.json`, self.public);
      } catch(e){
        // console.log(e)
      }
      return res();
    })
  }

  syncGroupData = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      const group = [...self.group.members];
      group.splice(group.indexOf(self.url), 1);
      if(group.length == 0) return res();
      const url = group[group.length * Math.random << 0];
      const paths = await new Promise(async (res, rej) => {
        await self.connectToServer(url);
        self.promises[`Got group paths from ${url}`] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Get group paths",
        }))
      });
      let dataPaths = [];
      for(let i=0;i<paths.length;i++){
        try {
          if(paths[i].startsWith("data/")){
            dataPaths.push(paths[i].substr(paths[i].indexOf("/") + 1));
          }
          const d = await self.get(paths[i]);
          await self.setLocal("all/" + paths[i], d);
        } catch(e){
          continue;
        }
      }
      for(let j=0;j<dataPaths.length;j++){
        try {
          await self.claimValorForData(dataPaths[j]);
        } catch(e){
          continue;
        }
      }
      return res();
    })
  }

  reassignGroupData = async () => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const keys = await localforage.keysStartingWith(`${self.path}all`);
        let paths = [];
        for(let i=0;i<keys.length;i++){
          paths.push(keys[i].substr(`${self.path}all/`.length))
        }
        let groups = {};
        for(let i=0;i<paths.length;i++){
          const groupIndex = jumpConsistentHash(paths[i], self.groups.length);
          if(groupIndex !== self.group.index){
            if(!groups[groupIndex]) groups[groupIndex] = [];
            groups[groupIndex].push(paths[i]);
          }
        }
        const gIndices = Object.keys(groups);
        for(let j=0;j<gIndices.length;j++){
          try { 
            const paths = groups[gIndices[j]];
            const url = self.groups[gIndices[j]][self.groups[gIndices[j]].length * Math.random() << 0];
            await new Promise(async (res, rej) => {
              await self.connectToServer(url);
              self.promises["Group " + self.group.index + " data taken over from " + url] = {res, rej}
              self.conns[url].send(JSON.stringify({
                event: "Take over group data",
                data: {
                  paths,
                  group: self.group.index
                }
              }))
            });

            const groupIndices = Object.keys(self.pastPaths);
            for(let k=0;k<groupIndices.length;k++){
              if(Math.abs(groupIndices[k] - self.groups.length) >= 2){
                for( let l=0;l<self.pastPaths[groupIndices[k]].length; i++){
                  try {
                    await localforage.removeItem(`${self.path}all/${self.pastPaths[groupIndices[k]][l]}`)
                  } catch(e){

                  }
                }
              }
            }
            self.pastPaths[self.group.length] = paths;
          } catch(e){

          }
        }
      } catch(e){
        // console.log(e)
      }
      res();
    });
  }

  getPublicFromUrl = async (url) => {
    const self = this;
    return new Promise(async (res, rej) => {
      let publicD;
      if(url == self.url) {
        publicD = Object.assign({}, self.public);
      } else {
        try {
          let pathUrl = url.replace(/\//g, "");
          pathUrl = pathUrl.replace(/\:/g, "");
          publicD = await self.get(`data/${pathUrl}/public.json`);
          if(!publicD){
            console.log("Asking the url for its own public info: " + url);
            publicD = await new Promise(async (res, rej) => {
              await self.connectToServer(url);
              self.promises["Got public from " + url] = {res, rej};
              self.conns[url].send(JSON.stringify({
                event: "Get public",
              }))
            })
            console.log(publicD);
          }
          const ecdsaPubHash = await subtle.digest("SHA-256", base64ToArrayBuffer(publicD.ecdsaPub));
          const id = buf2hex(ecdsaPubHash).substr(24, 64);
          if(publicD.id !== id) return rej({err: "Invalid public data"});
        } catch(e){
          console.log(e);
          return rej(e)
        }
      }
      publicD.ecdsaPub = await subtle.importKey(
        'raw',
        base64ToArrayBuffer(publicD.ecdsaPub),
        {
          name: 'ECDSA',
          namedCurve: 'P-384'
        },
        true,
        ['verify']
      )
      publicD.ecdhPub = await subtle.importKey(
        'raw',
        base64ToArrayBuffer(publicD.ecdhPub),
        {
          name: 'ECDH',
          namedCurve: 'P-384'
        },
        true,
        []
      )         
      return res(publicD);
    });
  };

  getPublicFromId = async (id) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        let publicD = await self.get(`data/${id}/public.json`);
        if(!publicD) {
          return rej({err: "Could not find public"});
        }
        const ecdsaPubHash = await subtle.digest("SHA-256", base64ToArrayBuffer(publicD.ecdsaPub));
        const pubId = buf2hex(ecdsaPubHash).substr(24, 64);
        if(publicD.id !== pubId) return rej({err: "Invalid public data"});
        publicD.ecdsaPub = await subtle.importKey(
          'raw',
          base64ToArrayBuffer(publicD.ecdsaPub),
          {
            name: 'ECDSA',
            namedCurve: 'P-384'
          },
          true,
          ['verify']
        )
        publicD.ecdhPub = await subtle.importKey(
          'raw',
          base64ToArrayBuffer(publicD.ecdhPub),
          {
            name: 'ECDH',
            namedCurve: 'P-384'
          },
          true,
          []
        )
        return res(publicD);
      } catch(e){
        rej(e)
      }
    });
  };

  sign = async (msg) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const signature = await subtle.sign(
          {
            name: "ECDSA",
            hash: {name: "SHA-384"},
          },
          self.ecdsa.privateKey,
          new TextEncoder().encode(msg)
        );
        res(signature)
      } catch(e) {
        rej(e)
      }
    })
  }

  verify = async (msg, sig, pubKey) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const isValid = await subtle.verify(
          {
            name: "ECDSA",
            hash: {name: "SHA-384"},
          },
          pubKey,
          sig,
          new TextEncoder().encode(msg)
        );
        if(isValid){
          res(isValid);
        } else {
          rej({err: "Invalid"});
        }
      } catch(e){
        rej(e)
      }
    })
  }


  setupWS = async (ws) => {
    const self = this;
    return new Promise(async(res, rej) => {
      ws.onclose = async (e) => {
        if(self.conns[ws.Url]?.dimension && self.dimensions[ws.dimension]){
          delete self.dimensions[ws.dimension].conns[ws.Url];
          const peers = Object.keys(self.dimensions[ws.dimension].conns);
          for(let i=0;i<self.group.members.length;i++){
            if(self.url == self.group.members[i] || ws.Url == self.group.members[i]) continue;
            await self.connectToServer(self.group.members[i]);
            self.conns[self.group.members[i]].send(JSON.stringify({
              event: "Peer has left group dimension",
              data: {
                dimension: ws.dimension,
                url: ws.Url
              }
            }))
          }
          for(let i=0;i<peers.length;i++){
            if(peers[i] == self.url) continue;
            self.conns[peers[i]]?.send(JSON.stringify({
              event: "Peer has left dimension",
              data: {
                dimension: ws.dimension,
                url: ws.Url
              }
            }))
          }
        }
        if(ws.Url && self.group && self.group.members.indexOf(ws.Url) !== -1){
          await self.handleMemberHasLeftGroup(ws, {index: self.group.index, url: ws.Url})
        } else if(
          self.group && self.groups &&
          self.groups[self.group.index + 1]?.indexOf(ws.Url) !== -1 &&
          self.groups[self.group.index + 1]?.length == 1
        ){
          await self.handleGroupRemoved(ws, {index: self.group.index + 1, url: ws.Url})
        } else if(
          self.group && self.groups && 
          self.groups[self.group.index - 1]?.indexOf(ws.Url) !== -1 && 
          self.groups[self.group.index - 1]?.length == 1
        ){
          await self.handleGroupRemoved(ws, {index: self.group.index - 1, url: ws.Url})
        }
        delete self.conns[ws.Url];
      }
      ws.onmessage = async (e) => {
        const d = JSON.parse(e.data);
        switch (d.event) {
          case 'Get public':
            await self.handleGetPublic(ws, d.data)
            break;
          case 'Got public':
            await self.handleGotPublic(ws, d.data);
            break;
          case 'Connect to server request':
            await self.handleConnectToServerRequest(ws, d.data);
            break;
          case 'Verify url request':
            await self.handleVerifyUrlRequest(ws, d.data);
            break;
          case 'Verify url with key':
            await self.handleVerifyUrlKey(ws, d.data);
            break;
          case 'Verify url':
            await self.handleVerifyUrl(ws)
            break;
          case 'Url verified':
            await self.handleUrlVerified(ws, d.data);
            break;
          case 'Verified peer url':
            await self.handleVerifiedPeerUrl(ws, d.data);
            break;
          case 'Origin url set':
            await self.handleOriginUrlSet(ws, d.data);
            break;
          case 'Get groups':
            await self.handleGetGroups(ws);
            break;
          case 'Got groups':
            await self.handleGotGroups(ws, d.data);
            break;
          case 'Request new group':
            await self.handleRequestNewGroup(ws, d.data);
            break;
          case 'New group response':
            await self.handleNewGroupResponse(ws, d.data);
            break;
          case 'Group can be created':
            await self.handleGroupCanBeCreated(ws, d.data);
            break;
          case 'Group can be created response':
            await self.handleGroupCanBeCreatedResponse(ws, d.data);
            break;
          case 'Join group':
            await self.handleJoinGroupRequest(ws);
            break;
          case 'Group not full':
            await self.handleGroupNotFull(ws);
            break;
          case 'Group not full response':
            await self.handleGroupNotFullResponse(ws, d.data);
            break;
          case 'Joined group':
            await self.handleJoinedGroup(ws, d.data);
            break;
          case 'Joined group success':
            await self.handleJoinedGroupSuccess(ws);
            break;
          // case 'Sign verification token':
          //   await self.handleSignVerificationToken(ws, d.data);
          //   break;
          // case 'Verify token signature':
          //   self.handleVerifyTokenSignature(ws, d.data);
          //   break;
          case 'New member in group':
            await self.handleNewMemberInGroup(ws, d.data);
            break;
          case 'New member in group response':
            await self.handleNewMemberInGroupResponse(ws, d.data);
            break;
          case 'Member has left group':
            await self.handleMemberHasLeftGroup(ws, d.data);
            break;
          case 'New group':
            await self.handleNewGroup(ws, d.data);
            break;
          case 'New group found':
            await self.handleNewGroupFound(ws, d.data);
            break;
          case 'Group removed':
            await self.handleGroupRemoved(ws, d.data);
            break;
          case "Sync ping":
            await self.handleSyncPing(ws, d.data)
            break;
          case "Sync pong":
            await self.handleSyncPong(ws, d.data)
            break;
          case "Share group sig":
            await self.handleShareGroupSig(ws, d.data)
            break;
          case "Got group sig":
            await self.handleGotGroupSig(ws, d.data)
            break;
          case "Get group paths":
            await self.handleGetGroupPaths(ws, d.data);
            break;
          case "Got group paths":
            await self.handleGotGroupPaths(ws, d.data);
            break;
          case "Get":
            await self.handleGet(ws, d.data);
            break;
          case "Set":
            await self.handleSet(ws, d.data);
            break; 
          case "Set request":
            await self.handleSetRequest(ws, d.data);
            break;
          case "Set request saved":
            await self.handleSetRequestSaved(ws, d.data);
            break;
          case "Get set request":
            await self.handleGetSetRequest(ws, d.data);
            break;
          case "Got set request":
            await self.handleGotSetRequest(ws, d.data);
            break;
          case "Group set":
            await self.handleGroupSet(ws, d.data);
            break;
          case "Group sot":
            await self.handleGroupSot(ws, d.data);
            break;
          case "Take over group data":
            await self.handleTakeOverGroupData(ws, d.data);
            break;
          case "Group data taken over":
            await self.handleGroupDataTakenOver(ws, d.data);
            break;
          case "Got":
            await self.handleGot(ws, d.data);
            break;
          case "Sot":
            await self.handleSot(ws, d.data);
            break; 
          case "Claim valor for path":
            await self.handleClaimValorForPath(ws, d.data);
            break;
          case "Claimed valor for path":
            await self.handleClaimedValorPath(ws, d.data);
            break;
          case "Get valor path":
            await self.handleGetValorPath(ws, d.data);
            break;
          case "Got valor path":
            await self.handleGotValorPath(ws, d.data);
            break;
          case "Get ledger":
            await self.handleGetLedger(ws, d.data);
            break;
          case "Got ledger":
            await self.handleGotLedger(ws, d.data);
            break;
          case "Add path to ledger":
            await self.handleAddPathToLedger(ws, d.data);
            break;
          case "Path added to ledger":
            await self.handlePathAddedToLedger(ws, d.data);
            break;
          case "Join dimension":
            await self.handleJoinDimension(ws, d.data);
            break;
          case "Joined dimension":
            await self.handleJoinedDimension(ws, d.data);
            break;
          case "New peer in dimension":
            await self.handleNewPeerInDimension(ws, d.data);
            break;
          case "Peer has left dimension":
            await self.handlePeerHasLeftDimension(ws, d.data);
            break;
          case "New peer in group dimension":
            await self.handleNewPeerInGroupDimension(ws, d.data);
            break;
          case "Peer has left group dimension":
            await self.handlePeerHasLeftGroupDimension(ws, d.data);
            break;
          case "Peer disconnect":
            await self.handlePeerDisconnect(ws, d.data);
            break;
          case "Got rtc description":
            self.handleGotRtcDescription(ws, d.data);
            break;
          case "Got rtc candidate":
            self.handleGotRtcCandidate(ws, d.data);
            break;
        }
        if(ws.callbacks && typeof ws.callbacks[d.event] == "function"){
          ws.callbacks[d.event](d.data);
        } 
      }
      res();
    })
  }

  now(){
    return Math.round(Date.now() + this.timeOffset);
  }

  heartbeat(ws){
    clearTimeout(ws.pingTimeout);
    ws.pingTimeout = setTimeout(() => {
      ws.terminate();
    }, 3500);
  }

  handleSyncPing = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      // setTimeout(() => {
        data.pingReceived = self.now();
        ws.send(JSON.stringify({
          event: "Sync pong",
          data
        }))
        return res()
      // }, self.testLatency)
    })
  }

  handleSyncPong = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      data.end = self.now();
      if(self.promises["Pong from " + ws.Url + " at " + data.start]){
        self.promises["Pong from " + ws.Url + " at " + data.start].res(data);
        delete self.promises["Pong from " + ws.Url + " at " + data.start]
      }
      return res();
    })
  }

  handleConnectToServerRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!ws.Url || !data.url) return res();
      try {
        await self.connectToServer(data.url);
      } catch(e){

      }
      return res();
    })
  }

  handleVerifyUrlRequest = async (ws, data) => {
    const self = this;
    return new Promise(async( res, rej) => {
      try {
        if(ws.Url || !data.url) return res();
        ws.verifyingUrl = data.url;
        self.verifying[data.url] = buf2hex(window.crypto.getRandomValues(new Uint8Array(32)))
        await new Promise(async(res, rej) => {
          self.promises["Verified url " + data.url + " with key"] = {res, rej}
          ws.send(JSON.stringify({
            event: "Verify url with key",
            data: {
              key: self.verifying[data.url]
            }
          }))
        })
        res();
      } catch(e){
        rej();
      }
    
    })
  }

  handleVerifyUrlKey = async (ws, data) => {
    const self = this;
    return new Promise(async( res, rej) => {
      if(!self.promises["Url verified with " + ws.Url] || !data.key) return res();
      let pathUrl = ws.Url.replace(/\//g, "");
      pathUrl = pathUrl.replace(/\:/g, "");
      await new Promise(async(res, rej) => {
        self.promises["Verified peer url for " + ws.Url + " at " + self.originUrl] = {res, rej};
        await self.connectToServer(self.originUrl);
        self.conns[self.originUrl].send(JSON.stringify({
          event: "Verify peer url with key",
          data: {
            id: self.id,
            url: ws.Url,
            key: data.key
          }
        }))
      })
      ws.send(JSON.stringify({
        event: "Verify url"
      }))
      return res();
    })
  }

  handleVerifyUrl = async (ws) => {
    const self = this;
    return new Promise(async( res, rej) => {
      try {
        if(!ws.verifyingUrl || !self.verifying[ws.verifyingUrl]) return res();
        const key = (await axios.get(ws.verifyingUrl + "valoria/verifying/" + self.pathUrl)).data;
        if(key == self.verifying[ws.verifyingUrl]){
          ws.Url = ws.verifyingUrl;
          self.conns[ws.Url] = ws;
          ws.send(JSON.stringify({
            event: "Url verified",
            data: {
              success: true
            }
          }))
        } else {
          ws.send(JSON.stringify({
            event: "Url verified",
            data: {
              err: true
            }
          }))
        }
      } catch(e){
        ws.send(JSON.stringify({
          event: "Url verified",
          data: {
            err: true
          }
        }))
      }
      return res();
    })
  }

  handleUrlVerified = async (ws, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.promises["Url verified with " + ws.Url]) return res();
      if(data.success){
        self.conns[ws.Url].verified = true;
        self.promises["Url verified with " + ws.Url].res()
      } else {
        self.promises["Url verified with " + ws.Url].rej();
      }
      delete self.promises["Url verified with " + ws.Url]
      res()
    })
  }

  handleVerifiedPeerUrl = async (ws, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.promises["Verified peer url for " + data.url + " at " + ws.Url]) return res();
      self.promises["Verified peer url for " + data.url + " at " + ws.Url].res();
      delete self.promises["Verified peer url for " + data.url + " at " + ws.Url]
      res()
    })
  }

  handleOriginUrlSet = async (ws, data) => {
    const self = this;
    return new Promise(async(res, rej) => {
      if(!self.promises["Origin url set with " + ws.Url]) return res();
      if(data.success){
        self.promises["Origin url set with " + ws.Url].res()
      } else {
        self.promises["Origin url set with " + ws.Url].rej();
      }
      delete self.promises["Origin url set with " + ws.Url]
      res()
    })
  }

  handleGetGroups(ws){
    const self = this;
    return new Promise(async( res, rej) => {
      ws.send(JSON.stringify({
        event: "Got groups",
        data: {
          groups: self.groups,
          start: self.start,
          sync: self.sync
        }
      }))
      return res();
    })
  }

  handleGotGroups(ws, data){
    const self = this;
    return new Promise(async( res, rej) => {
      if(self.promises["Got groups from " + ws.Url]){
        self.promises["Got groups from " + ws.Url].res(data)
        delete self.promises["Got groups from " + ws.Url];
      }
      res();
    })
  }

  handleGetGroupPaths(ws){
    const self = this;
    return new Promise(async( res, rej) => {
      const keys = await localforage.keysStartingWith(`${self.path}all/`);
      let paths = [];
      for(let i=0;i<keys.length;i++){
        paths.push(keys[i].substr(`${self.path}all/`.length))
      }
      ws.send(JSON.stringify({
        event: "Got group paths",
        data: {
          paths
        }
      }))
      return res();
    })
  }

  handleGotGroupPaths(ws, data){
    const self = this;
    return new Promise(async( res, rej) => {
      if(self.promises["Got group paths from " + ws.Url]){
        self.promises["Got group paths from " + ws.Url].res(data.paths)
        delete self.promises["Got group paths from " + ws.Url]
      }
      return res();
    })
  }

  handleJoinGroupRequest = async (ws) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        const g = self.group;
        if(g.members.indexOf(ws.Url) !== -1){
          ws.send(JSON.stringify({
            event: "Joined group",
            data: {err: "Already joined group"}
          }));
          res();
          return
        }
        if(g.members.length < g.max){
          try {
            for(let i=0;i<g.members.length;i++){
              if(g.members[i] == self.url) continue;
              await self.connectToServer(g.members[i]);
              await new Promise(async (res, rej) => {
                self.promises["Group not full from " + g.members[i]] = {res, rej};
                self.conns[g.members[i]].send(JSON.stringify({
                  event: "Group not full",
                }))
              })
            }
          } catch (e){
            ws.send(JSON.stringify({
              event: "Joined group",
              data: {err: "Not seeking new members"}
            }));
            return res();
          }
          g.members.push(ws.Url);
          g.updated = self.now();
          g.version += 1;
          self.groups[g.index] = g.members;
          for(let i=0;i<g.members?.length;i++){
            if(g.members[i] == self.url || g.members[i] == ws.Url) continue;
            await new Promise(async (res, rej) => {
              await self.connectToServer(g.members[i]);
              self.promises["New member in group response from " + g.members[i] + " for version " + g.version] = {res, rej};
              self.conns[g.members[i]].send(JSON.stringify({
                event: "New member in group",
                data: g
              }))
            })
          }
          self.conns[ws.Url].send(JSON.stringify({
            event: "Joined group",
            data: g
          }));
          await new Promise((res, rej) => {
            self.promises["Joined group success from " + ws.Url] = {res, rej};
          })

          //SEND GROUP DATA TO NEW MEMBER. TODO - MUST SEND ALL DATA BEFORE THE SERVER CLAIMS THE DATA. 
          // let paths = getDirContents(__dirname + "/data/servers/" + self.pathUrl + "/all");
          // for(let i=0;i<paths.length;i++){
          //   let path = paths[i].substr(paths[i].indexOf("/") + 1);
          //   path = path.substr(path.indexOf("/") + 1);
          //   path = path.substr(path.indexOf("/") + 1);
          //   // if(path.startsWith("ledgers/")) continue;
          //   const groupIndex = jumpConsistentHash(path, self.groups.length);
          //   if(groupIndex == self.group.index){
          //     try {
          //       await new Promise(async (res, rej) => {
          //         const data = await self.getLocal("all/" + path);
          //         self.promises["Group sot for " + path + " from " + ws.Url] = {res, rej};
          //         ws.send(JSON.stringify({
          //           event: "Group set",
          //           data: {
          //             path,
          //             data
          //           }
          //         }));
          //       })
          //     } catch(e){}
          //   }
          // }

          if(self.groups[g.index - 1]?.length > 0){
            const servers = self.groups[g.index - 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data: g
            }))
          }
          if(self.groups[g.index + 1]?.length > 0){
            const servers = self.groups[g.index + 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data: g
            }))
          }
          // await self.setLocal("group.json", self.group);
          // await self.setLocal("groups.json", self.groups);
          res()
          return
        } else {
          ws.send(JSON.stringify({
            event: "Joined group",
            data: {err: "Not seeking new members"}
          }));
          res();
          return
        }
      } catch (e){
        console.log(e);
        res();
      }
    })
  }

  handleGroupNotFull = async (ws) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!ws.Url || !self.group || self.group.members.indexOf(ws.Url) == -1) return res();
      ws.send(JSON.stringify({
        event: "Group not full response",
        data: self.group.members.length < self.group.max
      }))
      return res()
    })
  }

  
  handleGroupNotFullResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Group not full from " + ws.Url]) return res();
      if(data){
        self.promises["Group not full from " + ws.Url].res();
      } else {
        self.promises["Group not full from " + ws.Url].rej();
      }
      delete self.promises["Group not full from " + ws.Url].rej();
      res();
    })
  }

  handleJoinedGroup(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Joined group from " + ws.Url]){
        if(data.err) {
          self.promises["Joined group from " + ws.Url].rej();
        } else {
          self.promises["Joined group from " + ws.Url].res(data)
        }
        delete self.promises["Joined group from " + ws.Url]
      }
      res();
    })
  }

  handleJoinedGroupSuccess(ws){
    const self = this;
    return new Promise((res, rej) => {
      if(self.promises["Joined group success from " + ws.Url]){
        self.promises["Joined group success from " + ws.Url].res();
        delete self.promises["Joined group success from " + ws.Url];
      }
      res()
    })
  }

  handleRequestNewGroup = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.index) return res();
      if(data.index == self.groups.length){
        console.log("group can be created");
        self.canCreate = data.index;
        try {
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            await new Promise(async (res, rej) => {
              self.promises[`Group ${data.index} can be created from ${self.group.members[i]}`] = {res, rej};
              self.conns[self.group.members[i]].send(JSON.stringify({
                event: "Group can be created",
                data: {
                  index: data.index
                }
              }))
            })
          }
        } catch(e){
          ws.send(JSON.stringify({
            event: "New group response",
            data: {
              success: false
            }
          }))
          return res();
        }
        ws.send(JSON.stringify({
          event: "New group response",
          data: {
            success: true
          }
        }))
      } else {
        ws.send(JSON.stringify({
          event: "New group response",
          data: {
            success: false
          }
        }))
      }
      return res();
    })
  }

  handleNewGroupResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["New group response from " + ws.Url]) return res();
      if(data.success){
        self.promises["New group response from " + ws.Url].res();
      } else {
        self.promises["New group response from " + ws.Url].rej();
      }
      delete self.promises["New group response from " + ws.Url]
      res();
    })
  }

  handleGroupCanBeCreated = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!ws.Url || !self.group || self.group.members.indexOf(ws.Url) == -1 || !data.index) return res();
      ws.send(JSON.stringify({
        event: "Group can be created response",
        data: {
          success: (data.index == self.groups.length && self.canCreate !== data.index),
          index: data.index
        }
      }))
      res();
    })
  }

  handleGroupCanBeCreatedResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises[`Group ${data.index} can be created from ${ws.Url}`]) return res();
      if(data.success){
        self.promises[`Group ${data.index} can be created from ${ws.Url}`].res();
      } else {
        self.promises[`Group ${data.index} can be created from ${ws.Url}`].rej();
      }
      delete self.promises[`Group ${data.index} can be created from ${ws.Url}`]
      res()
    })
  }

  handleNewGroup = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!ws.Url && data.url){
          await this.connectToServer(data.url);
        }
        if(!data.group || data.group.index < 0 || !ws.Url) return
        if(data.group.index !== self.groups.length) {
          ws.send(JSON.stringify({
            event: "New group found",
            data: {success: false}
          }))
          return res();
        }
        if(self.group.members.indexOf(ws.Url) !== -1){
          self.groups.push(data.group.members);
          if(self.canCreate && self.canCreate == data.index) self.canCreate = null;
          await self.updateValorClaims();
          await self.reassignGroupData();
          if(self.dimension?.id) await self.joinDimension(self.dimension.id)
        }
        else if((data.group.index == self.groups.length && data.group.index == self.group.index + 1) || self.groups[self.group.index + 1]?.indexOf(ws.Url) !== -1){
          self.groups.push(data.group.members);
          if(self.canCreate && self.canCreate == data.index) self.canCreate = null;
          if(self.dimension?.id) await self.joinDimension(self.dimension.id)
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            self.conns[self.group.members[i]].send(JSON.stringify({
              event: "New group",
              data
            }))
          }
          if(self.group.index > 0 && self.groups[self.group.index - 1]){
            const url = self.groups[self.group.index - 1][self.groups[self.group.index - 1]?.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New group",
              data: {
                ...data,
                url: self.url
              }
            }))
          }
          // await fs.writeFileSync(`${self.path}groups.json`, JSON.stringify(self.groups, null, 2));
          await self.updateValorClaims();
          await self.reassignGroupData();
          ws.send(JSON.stringify({
            event: "New group found",
            data: {success: true}
          }))
        }
      } catch(e){
        console.log(e)
      }
      await self.setLocal("group.json", self.group);
      await self.setLocal("groups.json", self.groups);
      res();
    })
  }

  handleNewGroupFound = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["New group found at " + ws.Url]){
        if(data.success){
          self.promises["New group found at " + ws.Url].res()
        } else {
          self.promises["New group found at " + ws.Url].rej()
        }
        delete self.promises["New group found at " + ws.Url];
      }
      res();
    })
  }

  handleGroupRemoved = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.groups[data.index]?.indexOf(data.url) !== -1 && self.groups[data.index]?.length == 1){
        self.groups.splice(data.index, 1);
        if(self.canCreate && self.canCreate == data.index) self.canCreate = null;
        if(data.index < self.group.index){
          self.group.index -= 1;
          self.group.version += 1;
          self.group.updated = self.sync;
        }
        await self.updateValorClaims();
        await self.reassignGroupData();
        if(self.dimension?.id) await self.joinDimension(self.dimension.id)
        if(self.group.members.indexOf(ws.Url) == -1){
          for(let i=0;i<self.group.members.length;i++){
            const url = self.group.members[i];
            if(url == self.url) continue;
            self.conns[url].send(JSON.stringify({
              event: "Group removed",
              data
            }))
          }
          if(data.index > self.group.index && self.groups[self.group.index - 1]){
            const g = self.groups[self.group.index - 1];
            const url = g[g.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "Group removed",
              data
            }))
          } else if(data.index < self.group.index && self.groups[self.group.index + 1]){
            const g = self.groups[self.group.index + 1];
            const url = g[g.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "Group removed",
              data
            }))
          }
        }

      }
      return res();
    })
  }

  handleNewMemberInGroup(ws, data){
    const self = this;  
    return new Promise(async (res, rej) => {
      if(!ws.Url || data.index < 0 || !self.group) return res();
      try {
        if(data.index < 0) return;
        if(!self.groups[data.index]) self.groups[data.index] = [];
        if(self.group.index == data.index  && self.group.members.indexOf(ws.Url) !== -1){
          if(self.group.version !== data.version - 1) return;
          self.group.members = Array.from(new Set([...self.group.members, ...data.members]));
          self.groups[data.index] = self.group.members;
          self.group.version += 1;
          self.group.updated = data.updated;
          ws.send(JSON.stringify({
            event: "New member in group response",
            data: {
              version: data.version
            }
          }))
        } else if(self.group.index > 0 && self.groups[self.group.index - 1] && self.groups[self.group.index - 1]?.indexOf(ws.Url) !== -1){
          self.groups[data.index] = Array.from(new Set([...self.groups[data.index], ...data.members]));
          if(self.groups[self.group.index + 1]?.length > 0){
            const servers = self.groups[self.group.index + 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data
            }))
          }
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            self.conns[self.group.members[i]].send(JSON.stringify({
              event: "New member in group",
              data
            }))
          }
        } else if(self.groups[self.group.index + 1] && self.groups[self.group.index + 1]?.indexOf(ws.Url) !== -1){
          self.groups[data.index] = Array.from(new Set([...self.groups[data.index], ...data.members]));
          if(self.group.index > 0 && self.groups[self.group.index - 1]?.length > 0){
            const servers = self.groups[self.group.index - 1];
            const url = servers[servers.length * Math.random() << 0];
            await self.connectToServer(url);
            self.conns[url].send(JSON.stringify({
              event: "New member in group",
              data
            }))
          }
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            await self.connectToServer(self.group.members[i]);
            self.conns[self.group.members[i]].send(JSON.stringify({
              event: "New member in group",
              data
            }))
          }
        } else if (self.group.members.indexOf(ws.Url) !== -1 && data.index !== self.group.index){
          self.groups[data.index] = Array.from(new Set([...self.groups[data.index], ...data.members]));
        }
        // await self.setLocal("group.json", self.group);
        // await self.setLocal("groups.json", self.groups);
      } catch (e){
        console.log(e)
      }
      res();
    })
  }

  handleNewMemberInGroupResponse = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["New member in group response from " + ws.Url + " for version " + data.version]) return res();
      self.promises["New member in group response from " + ws.Url + " for version " + data.version].res();
      delete self.promises["New member in group response from " + ws.Url + " for version " + data.version];
      return res()
    })
  }

  handleMemberHasLeftGroup = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.group.index == data.index && self.group.members.indexOf(data.url) !== -1){
        if(self.conns[data.url]) delete self.conns[data.url]
        if(self.peers[data.url]) delete self.peers[data.url]
        self.group.members.splice(self.group.members.indexOf(data.url), 1);
        if(self.groups[self.group.index].indexOf(data.url) !== -1){
          self.groups[self.group.index].splice(self.groups[self.group.index].indexOf(data.url), 1); 
        }
        self.group.updated = self.sync;
        self.group.version += 1;
      } else if (self.groups[data.index].indexOf(data.url) !== -1){
        if(self.conns[data.url]) delete self.conns[data.url]
        if(self.peers[data.url]) delete self.peers[data.url]
        self.groups[data.index].splice(self.groups[data.index].indexOf(data.url), 1); 
        if(self.group.members.indexOf(ws.Url) == -1){
          for(let i=0;i<self.group.members.length;i++){
            let url = self.group.members[i];
            if(url == self.url) continue;
            self.conns[url].send(JSON.stringify({
              event: "Member has left group",
              data
            }))
          }
        }
      }
      if(self.groups[self.group.index + 1] && data.index <= self.group.index){
        const g = self.groups[self.group.index + 1];
        const url = g[g.length * Math.random() << 0];
        await self.connectToServer(url);
        self.conns[url].send(JSON.stringify({
          event: "Member has left group",
          data
        }))
        console.log("Telling " + url + " about " + data.url + " disconnect")
      }
      if(self.groups[self.group.index - 1] && data.index >= self.group.index){
        const g = self.groups[self.group.index - 1];
        const url = g[g.length * Math.random() << 0];
        await self.connectToServer(url);
        self.conns[url].send(JSON.stringify({
          event: "Member has left group",
          data
        }))
        console.log("Telling " + url + " about " + data.url + " disconnect")
      }
      await self.updateValorClaims();
      return res();
    });
  }

  handleGet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.path || !data.now) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          const d = self.saving[self.sync]["all/" + data.path] || await self.getLocal("all/" + data.path);
          ws.send(JSON.stringify({
            event: "Got",
            data: {
              path: data.path,
              data: d,
              now: data.now
            }
          }))
        }
      } catch(e){

      }
      return res()
    })
  }

  handleSet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.path || !data.data) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          let request = await self.get("requests/" + data.path);
          if(!request) return err();
          if(request.url){
            if(request.url !== ws.Url) return err();
            try {
              let publicD = await self.getPublicFromUrl(request.url);
              if(!publicD) return err();
              await self.verify(JSON.stringify(data.data), base64ToArrayBuffer(request.data), publicD.ecdsaPub);
            } catch(e){
              return err()
            }
          }
          await self.setLocal("all/data/" + data.path, data.data);
          ws.send(JSON.stringify({
            event: "Sot",
            data: {
              path: data.path,
              success: true
            }
          }));
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            try {
              await new Promise(async (res, rej) => {
                self.promises["Group sot for data/" + data.path + " from " + self.group.members[i]] = {res, rej};
                await self.connectToServer(self.group.members[i]);
                self.conns[self.group.members[i]].send(JSON.stringify({
                  event: "Group set",
                  data: {
                    data: data.data,
                    path: "data/" + data.path
                  }
                }));
              })
            } catch(e){

            }
          }
          await self.claimValorForData(data.path);
        } else {
          return err();
        }
        function err(){
          ws.send(JSON.stringify({
            event: "Sot",
            data: {
              path: data.path,
              err: true
            }
          }))
          return res()
        }
      } catch(e){

      }
      return res()
    })
  }

  handleSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.request) return res();
        if(ws.Url && self.groups[data.request.group]?.indexOf(ws.Url) !== -1){
          const d = await self.getLocal("all/requests/" + data.request.path);
          if(d && d.from == data.request.from) {
            try {
              await self.verify(JSON.stringify(data), base64ToArrayBuffer(d.data), self.ecdsa.publicKey);
              ws.send(JSON.stringify({
                event: "Set request saved",
                data: {
                  path: data.request.path,
                  err: true
                }
              }))
              return res()
            } catch(e){

            }
          }
          await self.setLocal("all/requests/" + data.request.path, data.request);
          ws.send(JSON.stringify({
            event: "Set request saved",
            data: {
              path: data.request.path,
              success: true
            }
          }))
          for(let i=0;i<self.group.members.length;i++){
            if(self.group.members[i] == self.url) continue;
            try {
              await new Promise(async (res, rej) => {
                self.promises["Group sot for requests/" + data.request.path + " from " + self.group.members[i]] = {res, rej};
                await self.connectToServer(self.group.members[i]);
                self.conns[self.group.members[i]].send(JSON.stringify({
                  event: "Group set",
                  data: {
                    data: data.request,
                    path: "requests/" + data.request.path
                  }
                }));
              })
            } catch(e){

            }
          }
        } else {
          ws.send(JSON.stringify({
            event: "Set request saved",
            data: {
              path: data.request.path,
              err: true
            }
          }))
        }
        return res()
      } catch(e){
        ws.send(JSON.stringify({
          event: "Set request saved",
          data: {
            path: data.request.path,
            err: true
          }
        }))
        return res();
      }
    })
  }

  handleSetRequestSaved = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Sent request to " + ws.Url + " for " + data.path]) return res();
      if(data.success){
        self.promises["Sent request to " + ws.Url + " for " + data.path].res();
      } else {
        self.promises["Sent request to " + ws.Url + " for " + data.path].rej();
      }
      delete self.promises["Sent request to " + ws.Url + " for " + data.path]
      return res()
    })
  }

  handleGetSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.path) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          const d = await self.getLocal("all/requests/" + data.path);
          ws.send(JSON.stringify({
            event: "Got set request",
            data: {
              path: data.path,
              request: d
            }
          }))
        }
      } catch(e){
      }
      return res()
    })
  }

  handleGotSetRequest = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got set request from " + ws.Url + " for " + data.path]) return res();
      self.promises["Got set request from " + ws.Url + " for " + data.path].res(data.request);
      delete self.promises["Got set request from " + ws.Url + " for " + data.path];
      return res()
    })
  }

  handleGroupSet = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.path || !data.data) return err();
        if(ws.Url && self.group?.members.indexOf(ws.Url) !== -1){
          // if(data.path.startsWith("ledgers/")) return err();
          await self.setLocal("all/" + data.path, data.data);
          if(data.path.startsWith("data/")){
            await self.claimValorForData(data.path.substr(5));
          }
          ws.send(JSON.stringify({
            event: "Group sot",
            data: {
              path: data.path,
              success: true
            }
          }));
        } else return err();
      } catch(e){
        console.log(e);
        return err();
      }
      function err(){
        ws.send(JSON.stringify({
          event: "Group sot",
          data: {
            path: data.path,
            err: true
          }
        }));
        return res();
      }
      return res()
    })
  }

  handleTakeOverGroupData = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.paths) return err();
        const paths = data.paths;
        if(ws.Url && self.groups[data.group].indexOf(ws.Url) !== -1){
          const pastLength = data.group > self.group.index ? self.group.index + 1 : self.group.index;
          let dataPaths = [];
          for(let i=0;i<paths.length;i++){
            if(jumpConsistentHash(paths[i], pastLength) !== data.group) continue;
            try {
              if(paths[i].startsWith("data/")){
                dataPaths.push(paths[i].substr(paths[i].indexOf("/") + 1));
              }
              const d = await new Promise(async(res, rej) => {
                const now = self.now()
                self.promises["Got data from " + ws.Url + " for " + paths[i] + " at " + now] = {res, rej};
                self.conns[ws.Url].send(JSON.stringify({
                  event: "Get",
                  data: {
                    path : paths[i],
                    group: self.group.index,
                    now
                  }
                }))
              });
              if(paths[i].startsWith("ledgers")){
                // delete d.sigs;
                // d.sigs = {};
              }
              await self.setLocal("all/" + paths[i], d);
            } catch(e){
              continue;
            }
          }
          ws.send(JSON.stringify({
            event: "Group data taken over",
            data: {
              group: data.group,
              success: true
            }
          }))
          res();
          for(let j=0;j<dataPaths.length;j++){
            try {
              await self.claimValorForData(dataPaths[j]);
            } catch(e){
              continue;
            }
          }
        } else {
          return err()
        }
      } catch(e){
        return err();
      }
      function err(){
        ws.send(JSON.stringify({
          event: "Group data taken over",
          data: {
            group: data.group,
            err: true
          }
        }))
        return res();
      }
      return res()
    })
  }

  handleGroupDataTakenOver = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Group " + data.group + " data taken over from " + ws.Url]) return res();
      if(data.success){
        self.promises["Group " + data.group + " data taken over from " + ws.Url].res()
      } else {
        self.promises["Group " + data.group + " data taken over from " + ws.Url].rej()
      }
      delete self.promises["Group " + data.group + " data taken over from " + ws.Url]
      return res()
    })
  }


  handleGot = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got data from " + ws.Url + " for " + data.path + " at " + data.now]) return res();
      self.promises["Got data from " + ws.Url + " for " + data.path + " at " + data.now].res(data.data);
      delete self.promises["Got data from " + ws.Url + " for " + data.path + " at " + data.now]
      return res()
    })
  }

  handleSot = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Set data from " + ws.Url + " for " + data.path]) return res();
      self.promises["Set data from " + ws.Url + " for " + data.path].res(data.success);
      delete self.promises["Set data from " + ws.Url + " for " + data.path]
      return res()
    })
  }

  handleGroupSot = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Group sot for " + data.path + " from " + ws.Url]) return res();
      self.promises["Group sot for " + data.path + " from " + ws.Url].res();
      delete self.promises["Group sot for " + data.path + " from " + ws.Url];
      return res()
    })
  }

  handleGetPublic = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      // if(!ws.Url) return res();
      ws.send(JSON.stringify({
        event: "Got public",
        data: self.public
      }));
      return res()
    })
  }

  handleGotPublic = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got public from " + ws.Url]) return res();
      self.promises["Got public from " + ws.Url].res(data);
      delete self.promises["Got public from " + ws.Url]
      return res()
    })
  }

  handleShareGroupSig = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      console.log("Handle share group sig from " + ws.Url);
      if(!ws.Url || !self.group || self.group.members.indexOf(ws.Url) == -1 || !data.path || !data.sig) return err();
      const d = self.saving[self.sync]["all/" + data.path] || await self.getLocal("all/" + data.path);
      if(!d || !d.data || !d.sigs || !d.sigs[self.url]) {
        return err()
      }
      console.log("Got data")
      const publicD = await self.getPublicFromUrl(ws.Url);
      if(!publicD || !publicD.ecdsaPub) return err();
      console.log("got public")
      try {
        await self.verify(JSON.stringify(d.data), base64ToArrayBuffer(data.sig), publicD.ecdsaPub);
        console.log("verified");
        d.sigs[ws.Url] = data.sig;
        self.saving[self.sync]["all/" + data.path] = d;
        await self.setLocal("all/" + data.path, d);
        ws.send(JSON.stringify({
          event: "Got group sig",
          data: {
            path: data.path,
            sig: d.sigs[self.url]
          }
        }));
        console.log("Sent success response")
        return res();
      } catch(e){
        return err();
      }
      function err(){
        ws.send(JSON.stringify({
          event: "Got group sig",
          data: {
            path: data.path,
            err: true
          }
        }));
        console.log("Sent error response")
        return res()
      }
    })
  }

  handleGotGroupSig = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      if(!self.promises["Got group sig for " + data.path + " from " + ws.Url]) return res();
      self.promises["Got group sig for " + data.path + " from " + ws.Url].res(data.sig)
      delete self.promises["Got group sig for " + data.path + " from " + ws.Url];
      return res()
    })
  }


  handleClaimValorForPath = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!ws.Url || !data.path || !data.url) return err();
        console.log("Handle claim valor for " + ws.Url);
        const valorGroupIndex = jumpConsistentHash("valor/" + data.id + "/" + data.path, self.groups.length);
        if(valorGroupIndex !== self.group.index) return err();
        const request = await self.getSetRequest(data.path);
        if(!request) return err("No set request found");
        let reqPublicD = await self.getPublicFromUrl(request.url);
        if(!reqPublicD) return err("no public found for " + request.url);
        const dataGroupIndex = jumpConsistentHash("data/" + data.path, self.groups.length);
        if(self.groups[dataGroupIndex].indexOf(data.url) == -1) return err("data saver is not in the right group");
        const now = self.now();
        await self.connectToServer(data.url);
        console.log("Handling claim: Getting the data for valor");
        const d = await new Promise(async(res, rej) => {
          self.promises["Got data from " + data.url + " for data/" + data.path + " at " + now] = {res, rej};
          self.conns[data.url].send(JSON.stringify({
            event: "Get",
            data: {
              path: "data/" + data.path,
              group: self.group.index,
              now
            }
          }))
        })
        if(!d) return err();
        console.log("handling claim: got data")
        const size = new TextEncoder().encode(JSON.stringify(d)).length;
        try {
          await self.verify(JSON.stringify(d), base64ToArrayBuffer(request.data), reqPublicD.ecdsaPub);
        } catch(e){
          console.log(e);
          // console.log(d);
          throw e;
        }
        console.log("handling claim: data verified")
        let valor = self.saving[self.sync][`all/valor/${data.id}/${data.path}`] || await self.get(`valor/${data.id}/${data.path}`);
        if(valor && valor.data && valor.sigs && valor.data.for == data.id && valor.data.path == data.path && valor.data.time?.length > 0){
          if(valor.data.size !== size){
            valor.data.size = size;
            delete valor.sigs;
            valor.sigs = {};
          }
          if(valor.data.time[valor.data.time.length - 1].length == 2){
            valor.data.time.push([data.sync]);
            delete valor.sigs;
            valor.sigs = {};
          }
        } else {
          valor = {
            data: {
              for: data.id,
              url: data.url,
              path: data.path,
              size,
              sync: data.sync,
              time: [[data.sync]]
            },
            sigs: {}
          }
        }
        valor.sigs[self.url] = await arrayBufferToBase64(await self.sign(JSON.stringify(valor)));
        self.saving[self.sync][`all/valor/${data.id}/${data.path}`] = valor;
        await self.setLocal(`all/valor/${data.id}/${data.path}`, valor);
        console.log("handling claim: sharing group sig");
        await self.shareGroupSig(`valor/${data.id}/${data.path}`);
        console.log("handling claim: valor saved");
        ws.send(JSON.stringify({
          event: "Claimed valor for path",
          data: {
            success: true,
            path: data.path
          }
        }))
        return res()
      } catch(e){
        err();
      }
      function err(e){
        console.log(e);
        ws.send(JSON.stringify({
          event: "Claimed valor for path",
          data: {
            err: true,
            path: data.path
          }
        }))
        return res()
      }
    })
  }

  handleClaimedValorPath(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Claimed valor for path " + data.path + " from " + ws.Url]){
        self.promises["Claimed valor for path " + data.path + " from " + ws.Url].res();
        delete self.promises["Claimed valor for path " + data.path + " from " + ws.Url]
      }
      return res();
    })
  }

  handleGetValorPath(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.path || !data.id) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          const d = await self.saving[self.sync][`all/valor/${data.id}/${data.path}`] || await self.getLocal(`all/valor/${data.id}/${data.path}`);
          ws.send(JSON.stringify({
            event: "Got valor path",
            data: {
              path: data.path,
              id: data.id,
              valor: d
            }
          }))
        }
      } catch (e){

      }
      return res();
    })
  }

  handleGotValorPath(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Got valor path " + data.path + " from " + ws.Url + " for " + data.id]){
        self.promises["Got valor path " + data.path + " from " + ws.Url + " for " + data.id].res(data.valor);
        delete self.promises["Got valor path " + data.path + " from " + ws.Url + " for " + data.id]
      }
      return res();
    })
  }

  handleGetLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!data.id) return res();
        if(ws.Url && self.groups[data.group]?.indexOf(ws.Url) !== -1){
          const d = await self.saving[self.sync]["all/ledgers/" + data.id + ".json"] || await self.getLocal("all/ledgers/" + data.id + ".json");
          ws.send(JSON.stringify({
            event: "Got ledger",
            data: {
              id: data.id,
              ledger: d
            }
          }))
        }
      } catch(e){

      }
      return res();
    })
  }

  handleGotLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises["Got ledger " + data.id + " from " + ws.Url]){
        self.promises["Got ledger " + data.id + " from " + ws.Url].res(data.ledger);
        delete self.promises["Got ledger " + data.id + " from " + ws.Url]
      }
      return res();
    })
  }

  handleAddPathToLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      try {
        if(!ws.Url || !data.path || !data.id) return res();
        console.log("handle add path to ledger for " + ws.Url);
        const valorGroupIndex = jumpConsistentHash(`valor/${data.id}/${data.path}`, self.groups.length);
        const valorGroup = self.groups[valorGroupIndex];
        let valor;
        let isValid = true;
        for(let j=0;j<valorGroup.length;j++){
          const url = valorGroup[j];
          let v;
          if(url == self.url) {
            v = await self.saving[self.sync][`all/valor/${data.id}/${data.path}`] || await self.getLocal(`all/valor/${data.id}/${data.path}`);
          } else {
            try {
              v = await new Promise(async(res, rej) => {
                await self.connectToServer(url);
                self.promises["Got valor path " + data.path + " from " + url + " for " + self.ownerId] = {res, rej};
                self.conns[url].send(JSON.stringify({
                  event: "Get valor path",
                  data: {
                    path: data.path,
                    id: self.ownerId,
                    group: self.group.index
                  }
                }))
              })
            } catch(e){

            }
          }
          if(!v || v.data.for !== data.id){
            break;
          } else if(!valor && v) {
            valor = JSON.stringify(v.data);
          } else if(v && valor !== JSON.stringify(v.data)){
            isValid = false;
            break;
          }
        }
        if(isValid){
          console.log("Handle valor is valid");
          let d = self.saving[self.sync]["all/ledgers/" + data.id + ".json"] || await self.getLocal("all/ledgers/" + data.id + ".json");
          if(!d || !d.data) d = {
            data: {
              paths: {},
              for: data.id,
            },
            sigs: {}
          }
          if(d.data.paths[data.path]) {
            ws.send(JSON.stringify({
              event: "Path added to ledger",
              data: {
                path: data.path,
                id: data.id,
                success: true
              }
            }));
            console.log("handle ledger success")
            return res();
          }
          d.data.paths[data.path] = 1
          delete d.sigs;
          d.sigs = {};
          d.sigs[self.url] = await arrayBufferToBase64(await self.sign(JSON.stringify(d.data)))
          self.saving[self.sync]["all/ledgers/" + data.id + ".json"] = d;
          await self.setLocal("all/ledgers/" + data.id + ".json", d);
          await self.shareGroupSig("ledgers/" + data.id + ".json");
          ws.send(JSON.stringify({
            event: "Path added to ledger",
            data: {
              path: data.path,
              id: data.id,
              success: true
            }
          }));
          console.log("handle ledger success")
        } else {
          throw "Valor not valid";
        }
      } catch(e){
        console.log(e);
        ws.send(JSON.stringify({
          event: "Path added to ledger",
          data: {
            path: data.path,
            id: data.id,
            err: true
          }
        }));
      }
      return res();
    })
  }

  reset = async () => {
    const self = this;
    return new Promise(async(res, rej) => {
      try {
        const keys = await localforage.keysStartingWith(`${self.path}all`)
        for(let i=0;i<keys.length;i++){
          await localforage.removeItem(keys[i]);
        }
      } catch(e){

      }
      res();
    })
  }

  handlePathAddedToLedger(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(self.promises[`Path ${data.path} added to ledger ${data.id} from ${ws.Url}`]){
        self.promises[`Path ${data.path} added to ledger ${data.id} from ${ws.Url}`].res();
        delete self.promises[`Path ${data.path} added to ledger ${data.id} from ${ws.Url}`];
      }
      return res();
    })
  }

  joinDimension(id){
    const self = this;
    return new Promise(async (res, rej) => {
      const groupIndex = jumpConsistentHash(id, self.groups.length);
      const group = self.groups[groupIndex];
      const url = group[group.length * Math.random() << 0];
      if(url !== self.url){
        await self.connectToServer(url);
        self.promises["Joined " + id + " dimension"] = {res, rej};
        self.conns[url].send(JSON.stringify({
          event: "Join dimension",
          data: {
            id: id
          }
        }));
      } else {
        await self.handleJoinDimension({Url : self.url}, {id})
        res();
      }
    })
  }

  handleJoinDimension(ws, data){
    const self = this;
    return new Promise(async( res, rej) => {
      const id = data.id;
      if(!self.dimensions[id]) self.dimensions[id] = {conns: {}};
      const peers = Object.keys(self.dimensions[id].conns)
      self.dimensions[id].conns[ws.Url] = ws;
      if(self.conns[ws.Url]) self.conns[ws.Url].dimension = id;
      if(ws.send){
        ws.send(JSON.stringify({
          event: "Joined dimension",
          data: {
            dimension: id,
            peers
          }
        }))
      } else if(ws.Url == self.url){
        await this.handleJoinedDimension({}, {dimension: id, peers});
      }
      for(let i=0;i<self.group.members.length;i++){
        if(self.url == self.group.members[i]) continue;
        await self.connectToServer(self.group.members[i]);
        self.conns[self.group.members[i]]?.send(JSON.stringify({
          event: "New peer in group dimension",
          data: {
            url: ws.Url,
            dimension: id
          }
        }))
      }
      for(let i=0;i<peers.length;i++){
        if(peers[i] == self.url) continue;
        await self.connectToServer(peers[i]);
        self.conns[peers[i]]?.send(JSON.stringify({
          event: "New peer in dimension",
          data: {
            url: ws.Url,
            dimension: id
          }
        }));
      }
      res();
    })
  }

  handleJoinedDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      const peers = data.peers;
      self.dimension = {
        id: data.dimension,
        peers,
        onPeerJoin: self.dimension.onPeerJoin || (() => {}),
        onPeerLeave: self.dimension.onPeerLeave || (() => {}),
      }
      for(let i=0;i<peers.length;i++){
        if(peers[i] == self.url) continue;
        if(!self.conns[peers[i]]) {
          self.connectToPeer(peers[i]);
        }
        self.dimension.onPeerJoin(peers[i]);
      }
      if(self.promises["Joined " + data.dimension + " dimension"]){
        self.promises["Joined " + data.dimension + " dimension"].res();
        delete self.promises["Joined " + data.dimension + " dimension"];
      }
      res();
    });
  }

  handleNewPeerInDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(data.dimension !== self.dimension.id || !data.url || data.url == self.url || self.dimension.peers.indexOf(data.url) !== -1) return res();
      self.connectToPeer(data.url);
      self.dimension.peers.push(data.url);
      self.dimension.onPeerJoin(data.url);
      res();
    });
  }

  handlePeerHasLeftDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(data.dimension !== self.dimension.id || !data.url) return res();
      self.dimension.peers.splice(self.dimension.peers.indexOf(data.url), 1);
      self.dimension.onPeerLeave(data.url);
      delete self.peers[data.url];
      res();
    });
  }

  handleNewPeerInGroupDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(!data.dimension || jumpConsistentHash(data.dimension, self.groups.length) !== self.group.index) return res();
      const id = data.dimension;
      if(!self.dimensions[id]) self.dimensions[id] = {conns: {}};
      const peers = Object.keys(self.dimensions[id].conns);
      self.dimensions[id].conns[data.url] = 1;
      if(self.conns[data.url]) self.conns[data.url].dimension = id;
      for(let i=0;i<peers.length;i++){
        if(peers[i] == self.url || !self.conns[peers[i]]) continue;
        self.conns[peers[i]]?.send(JSON.stringify({
          event: "New peer in dimension",
          data: {
            url: data.url,
            dimension: id
          }
        }));
      }
      res();
    });
  }

  handlePeerHasLeftGroupDimension(ws, data){
    const self = this;
    return new Promise(async (res, rej) => {
      if(jumpConsistentHash(data.dimension, self.groups.length) !== self.group.index || !data.dimension) return res();
      delete self.dimensions[data.dimension]?.conns[data.url];
      const peers = Object.keys(self.dimensions[data.dimension].conns);
      for(let i=0;i<peers.length;i++){
        if(peers[i] == self.url || !self.conns[peers[i]]) continue;
        self.conns[peers[i]]?.send(JSON.stringify({
          event: "Peer has left dimension",
          data: {
            dimension: data.dimension,
            url: data.url
          }
        }))
      }
      res();
    });
  }

  handlePeerDisconnect = async (ws, data) => {
    const self = this;
    return new Promise(async (res, rej) => {
      // console.log(self.conns[data.url]?.peerServer);
      // if(self.conns[data.url] && self.conns[data.url].peerServer == ws.Url){
      if(ws.Url && ws.verified){
        self.conns[data.url]?.onclose();
        console.log("Peer disconnect from " + ws.Url);
        delete self.peers[data.url];
      }
      res();
    })
  }

  async connectToPeer(url){
    const self = this;
    return new Promise(async (res, rej) => {
      if(!url || !url.includes("valoria/peers/") || url == self.url) return rej({err: "Bad peer url"});
      const originUrl = url.substring(0, url.indexOf("valoria/peers/"));
      // let id = url.substring(url.indexOf("valoria/peers/") + 14, url.length - 1);
      if(!self.peers[url]){
        await self.connectToServer(originUrl);
        console.log("connected to origin server");
        console.log("Making new peer connection")
        self.peers[url] = new RTCPeerConnection({iceServers});
        self.peers[url].onStream = self.peers[url].onStream || (() => {});
        self.peers[url].datachannel = self.peers[url].createDataChannel("Data");
        self.peers[url].datachannel.onopen = async () => {
          console.log("datachannel open");
          self.peers[url].datachannel.open = true;
          self.peers[url].datachannel.verified = true;
          self.peers[url].datachannel.Url = url;
          self.peers[url].datachannel.on = (event, cb) => {
            if(!self.peers[url].datachannel.callbacks) self.peers[url].datachannel.callbacks = {}
            self.peers[url].datachannel.callbacks[event] = cb;
          }
          self.peers[url].datachannel.peerServer = originUrl;
          await self.setupWS(self.peers[url].datachannel);
          self.peers[url].onconnectionstatechange = () => {
            if(self.peers[url] && self.peers[url].connectionState == "disconnected"){
              self.peers[url].datachannel?.onclose();
              delete self.peers[url];
            }
          };
          self.conns[url] = self.peers[url].datachannel
          res(self.peers[url].datachannel);
        };
        if(self.stream && self.stream.getTracks){
          self.stream.getTracks().forEach(track => self.peers[url].addTrack(track, self.stream));
        }
        self.peers[url].onicecandidate = ({candidate}) =>  {
          if(!candidate) return;
          self.conns[originUrl].send(JSON.stringify({
            event: "Send rtc candidate",
            data: {
              candidate,
              url
            }
          }));
        }
        self.peers[url].onnegotiationneeded = async options => {
          if(!self.peers[url]) return;
          try {
            self.peers[url].makingOffer = true;
            await self.peers[url].setLocalDescription();
            self.conns[originUrl].send(JSON.stringify({
              event: "Send rtc description",
              data: {
                desc: self.peers[url].localDescription,
                url
              }
            }));
            console.log("sent offer");
          } catch (err) {
            console.error(err);
          } finally {
            self.peers[url].makingOffer = false;
          }
        };
        self.peers[url].ontrack = (e) => {
          self.peers[url].stream = e.streams[0];
          self.peers[url].onStream(e.streams[0]);
        }
        self.peers[url].oniceconnectionstatechange = () => {
          if (self.peers[url] && self.peers[url].iceConnectionState === "failed") {
            self.peers[url].restartIce();
          }
        };
      } else if (self.peers[url]?.datachannel?.open){
        return res(self.peers[url].datachannel);
      } 
      else if(self.peers[url].localDescription){
        self.conns[originUrl].send(JSON.stringify({
          event: "Send rtc description",
          data: {
            desc: self.peers[url].localDescription,
            url
          }
        }));
      }
    })
  }

  async handleGotRtcDescription(ws, data){
    const self = this;
    const description = data.desc;
    const url = data.url;
    const polite = data.polite;
    console.log("Got webrtc desc from " + data.url)
    if(self.peers[url] && self.peers[url]?.datachannel?.open) return;
    if(self.peers[url] && description.type == "offer") delete self.peers[url];
    if(!self.peers[url]){
      self.peers[url] = new RTCPeerConnection({iceServers});
      self.peers[url].onStream = self.peers[url].onStream || (() => {});
      if(self.stream && self.stream.getTracks){
        self.stream.getTracks().forEach(track => self.peers[url].addTrack(track, self.stream));
      }
      self.peers[url].ontrack = (e) => {
        self.peers[url].stream = e.streams[0];
        self.peers[url].onStream(e.streams[0]);
      }
      self.peers[url].onicecandidate = ({candidate}) =>  {
        if(!candidate) return;
        ws.send(JSON.stringify({
          event: "Send rtc candidate",
          data: {
            candidate,
            url
          }
        }));
      }
      self.peers[url].ondatachannel = async (event) => {
        self.peers[url].datachannel = event.channel;
        self.peers[url].datachannel.onopen = async () => {
          self.peers[url].datachannel.verified = true;
          self.peers[url].datachannel.open = true;
          self.peers[url].datachannel.Url = url;
          self.peers[url].datachannel.on = (event, cb) => {
            if(!self.peers[url].datachannel.callbacks) self.peers[url].datachannel.callbacks = {}
            self.peers[url].datachannel.callbacks[event] = cb;
          }
          self.peers[url].datachannel.peerServer = ws.Url;
          await self.setupWS(self.peers[url].datachannel);
          self.conns[url] = self.peers[url].datachannel
        };
      };
      self.peers[url].onconnectionstatechange = () => {
        if(self.peers[url] && self.peers[url].connectionState == "disconnected"){
          self.peers[url].datachannel?.onclose();
          delete self.peers[url];
        }
      }
    }

    try {
      if (description) {
        const readyForOffer =
          !self.peers[url].makingOffer &&
          (self.peers[url].signalingState == "stable" || self.peers[url].isSRDAnswerPending);
        const offerCollision = description.type == "offer" && !readyForOffer;
        let ignoreOffer = !polite && offerCollision;
        if (ignoreOffer) {
          console.log('ignoring that shi')
          return;
        }
        self.peers[url].isSRDAnswerPending = description.type == 'answer';
        console.log("Setting remote " + description.type + " description");
        await self.peers[url].setRemoteDescription(description);
        self.peers[url].isSRDAnswerPending = false;
        if (description.type == "offer") {
          await self.peers[url].setLocalDescription();
          ws.send(JSON.stringify({
            event: "Send rtc description",
            data: {
              desc: self.peers[url].localDescription,
              url
            }
          }));
        }
      }
    } catch(err) {
      console.error(err);
    }
    
  }

  async handleGotRtcCandidate(ws, data){
    const self = this;
    if(!self.peers[data.url]) return;
    try {
      if(!data.candidate) return;
      await self.peers[data.url].addIceCandidate(data.candidate)
    } catch (e) {
    }
  }

}


async function arrayBufferToBase64(buffer){
  return new Promise((res, rej) => {
    var blob = new Blob([buffer])
    var reader = new FileReader();
    reader.onload = function(event){
      var base64 = event.target.result.split(',')[1]
      res(base64);
    };
    reader.readAsDataURL(blob);
  })
}

function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

function buf2hex(buffer) {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

async function wrapCryptoKeyGCM(keyToWrap, salt, encryptKey, iv) {
  return new Promise(async (res, rej) => {
    // get the key encryption key
    const wrappingKey = await window.crypto.subtle.deriveKey(
      {
        "name": "PBKDF2",
        salt: salt,
        "iterations": 100000,
        "hash": "SHA-256"
      },
      encryptKey,
      { "name": "AES-GCM", "length": 256},
      true,
      [ "wrapKey", "unwrapKey" ]
    );
    const wrappedKey = await window.crypto.subtle.wrapKey(
      "jwk",
      keyToWrap,
      wrappingKey,
      {
        name: "AES-GCM",
        iv: iv
      }
    );
    const base64 = await arrayBufferToBase64(wrappedKey);
    res(base64);
  })
}

function getKeyGCM(keyMaterial, salt) {
  return window.crypto.subtle.deriveKey(
    {
      "name": "PBKDF2",
      salt: salt,
      "iterations": 100000,
      "hash": "SHA-256"
    },
    keyMaterial,
    { "name": "AES-GCM", "length": 256},
    true,
    [ "wrapKey", "unwrapKey" ]
  );
}

const mean = (array) => array.reduce((a, b) => a + b) / array.length;
const variance = (array) => array.length < 2 ? 0 : array.map(x => Math.pow(x - mean(array), 2)).reduce((a, b) => a + b) / (array.length - 1);
const std = (array) => Math.sqrt(variance(array));
function mode (arr){
  const mode = {};
  let max = 0, count = 0;

  for(let i = 0; i < arr.length; i++) {
    const item = arr[i];
    
    if(mode[item]) {
      mode[item]++;
    } else {
      mode[item] = 1;
    }
    
    if(count < mode[item]) {
      max = item;
      count = mode[item];
    }
  }
   
  return max;
};

function simpleHash(str){
  var hash = 0;
  if (str.length == 0) {
      return hash;
  }
  for (var i = 0; i < str.length; i++) {
      var char = str.charCodeAt(i);
      hash = ((hash<<10)-hash)+char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function jumpConsistentHash(key, numBuckets) {
  let keyBigInt = BigInt(simpleHash(key));
  let b = -1n;
  let j = 0n;
  while (j < numBuckets) {
      b = j;
      keyBigInt = (keyBigInt * 2862933555777941757n) % (2n ** 64n) + 1n;
      j = BigInt(Math.floor((Number(b) + 1) * Number(1n << 31n) / Number((keyBigInt >> 33n) + 1n)));
  }
  return (Number(b));
}

async function digestMessage(message) {
  return new Promise(async (res, rej) => {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await subtle.digest('SHA-256', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    res(hashHex);
  });
}

window.valoria = new Valoria();