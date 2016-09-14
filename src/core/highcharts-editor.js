/******************************************************************************

Copyright (c) 2016, Highsoft

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

******************************************************************************/

/**
 * RGB Color value
 * @typedef {Object} RGBColorObject
 * @property {number} r - red component
 * @property {number} g - green component
 * @property {number} b - blue component
 */


 //////////////////////////////////////////////////////////////////////////////

/** 
 * The main highcharts editor namespace
 * @exports highed
 * @namespace highed
 */
var highed = {
    schemas: {},
    meta: {},
    plugins: {},

    /* Clear an object */
    clearObj: function (obj) {
        Object.keys(obj).forEach(function (key) {
            delete obj[key];
        });
    },

    /* Preform an AJAX request. Same syntax as jQuery. */
    ajax: function (p) {
        var props = highed.merge({
            url: false,
            type: 'GET',
            dataType: 'json',
            success: function () {},
            error: function () {},
            data: {},
            autoFire: true
          }, p),
          headers = {
            json: 'application/json',
            xml: 'application/xml',
            text: 'text/plain',
            octet: 'application/octet-stream'
          },
          r = new XMLHttpRequest(),
          events = highed.events()
        ;

        if (!props.url) return false;

        r.open(props.type, props.url, true);
        r.setRequestHeader('Content-Type', headers[props.dataType] || headers.text);

        r.onreadystatechange = function () {
            events.emit('ReadyStateChange', r.readyState, r.status);

            if (r.readyState === 4 && r.status === 200) {         
              if (props.dataType === 'json') {        
                try {
                  var json = JSON.parse(r.responseText);
                  if (highed.isFn(props.success)) {
                    props.success(json);        
                  }
                  events.emit('OK', json);
                } catch(e) {
                  if (highed.isFn(props.error)) {
                    props.error(e.toString(), r.responseText);
                  }
                  events.emit('Error', e.toString(), r.status);
                }      
              } else {
                if (highed.isFn(props.success)) {
                  props.success(r.responseText);
                }        
                events.emit('OK', r.responseText);
              }         
            } else if (r.readyState === 4) {
              events.emit('Error', r.status, r.statusText);
              if (highed.isFn(props.error)) {
                props.error(r.status, r.statusText);
              }
            }
        };

        function fire() {
            try {
              r.send(JSON.stringify(props.data));            
            } catch (e) {
              r.send(props.data || true);      
            }    
        }

        if (props.autoFire) {
            fire();    
        }

        return {
            on: events.on,
            fire: fire,
            request: r
        };
    },

    /** Generate a uuid 
     * Borrowed from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     */
    uuid: function () {
        var d = new Date().getTime(), uuid;
        
        if (window.performance && typeof window.performance.now === "function") {
            d += performance.now(); //use high-precision timer if available
        }
        
        uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    },

    /** Map an array to an object
     * @param {array} arr - the array to map
     * @return {object}
     */
    arrToObj: function (arr) {
        var obj = {};

        if (highed.isStr(arr)) {
            arr = arr.split(' ');
        }

        arr.forEach(function (thing) {
            obj[thing] = true;
        });

        return obj;
    },

    /** Make a camel back string pretty
     * @param {string} - the input string
     * @return {string} - the transformed string
     */
    uncamelize: function (str) {
        var s = '';

        if (str.length < 0 || !str) {
            return str;
        }

        for (var i = 0; i < str.length; i++) {
            if (str[i] === str[i].toUpperCase()) {
                s += ' ';
            }
            s += str[i];            
        }

        return s[0].toUpperCase() + s.substr(1);
    },

    /** Clamp a number between min/max
     * @param {number} - minimum value
     * @param {number} - maximum value
     */
    clamp: function (min, max, value) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    },

    /** 
     * Convert a hex value to RGB
     *
     * @memberof highed
     * @method hexToRgb
     * @param {string} hex - the hex string
     * @return {RGBColorObject}
     */
    hexToRgb: function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {
            r: 0, g: 0, b: 0
        };
    },

    /** Invert a color 
     * @memberof highed
     * @param {string} hex - the color to invert
     * @return {string} new hex color
     */
    invertHexColor: function (hex) {
        var rgb = highed.hexToRgb(hex),
            res = 0
        ;

        rgb.r = 255 - rgb.r;
        rgb.g = 255 - rgb.g;
        rgb.b = 255 - rgb.b;

        res = rgb.r << 16;
        res |= rgb.g << 8;
        res |= rgb.b;

        return '#' + res;
    },

    /** Return #FFF or #000 based on the intensity of a color
     * @memberof highed
     * @param {string} hex - input color
     * @return {string} the new hex color
     */
    getContrastedColor: function (hex) {
        var rgb = highed.hexToRgb(hex),
            avarage = (rgb.r + rgb.g + rgb.b) / 3
        ;

        if (avarage > 150) {
            return '#000';
        }
        return '#FFF';
    },

    /** Convert a string to a bool
     * @memberof highed
     * @param {string} what - the string to convert
     * @return {bool}
     */
    toBool: function (what) {
        return what === 'true' || what === true || what === 'on';
    },

    /**
     * Set a property based on -- delimited path  
     * @memberof highed
     * @param {object} obj - the object to modify
     * @param {string} path - the path to the attribute to change
     * @param {(String|Bool|Object|Number)} value - the value to set
     */
    setAttr: function (obj, path, value, index) {
        var current = obj;

        if (highed.isArr(obj)) {
            obj.forEach(function (thing) {
                highed.setAttr(thing, path, value, index);
            });
            return;
        }

        path = path.replace(/\-\-/g, '.').replace(/\-/g, '.').split('.');

        path.forEach(function(p, i) {
            if (i === path.length - 1) {  
                current[p] = value;                                     
            } else {
                if (typeof current[p] === 'undefined') {
                    current = current[p] = {};
                } else {
                    current = current[p]; 

                    if (highed.isArr(current) && index >= 0 && index < current.length) {
                        current = current[index];
                    }                      
                }
            }
        });
    },

    getAttr: function (obj, path, index) {
        var current = obj,
            result = false
        ;

        if (highed.isArr(obj)) {
            obj.forEach(function (thing) {
                result = highed.getAttr(thing, path);
            });
            return result;
        }

        path = path.replace(/\-\-/g, '.').replace(/\-/g, '.').split('.');

        path.forEach(function(p, i) {
            if (i === path.length - 1) {    
                result = current[p];                 
            } else {
                if (typeof current[p] === 'undefined') {
                    current = current[p] = {};
                } else {
                    current = current[p];         

                    if (highed.isArr(current) && index >= 0 && index < current.length) {
                        current = current[index];
                    }               
                }
            }
        });

        return result;
    },

    /**
     * Deep merge two objects.
     * Note: this modifies object `a`!
     * @memberof highed
     * @param {object} a - the destination object
     * @param {object} b - the source object
     * @return {object} - argument a
     */
    merge: function (a, b) {
        if (!a || !b) return a || b;    
        Object.keys(b).forEach(function (bk) {
         if (highed.isNull(b[bk]) || highed.isBasic(b[bk])) {
            a[bk] = b[bk];
         } else if (highed.isArr(b[bk])) {
           
           a[bk] = [];
           
           b[bk].forEach(function (i) {
             if (highed.isNull(i) || highed.isBasic(i)) {
               a[bk].push(i);
             } else {
               a[bk].push(highed.merge({}, i));
             }
           });
         } else if (b[bk].tagName && b[bk].appendChild && b[bk].removeChild && b[bk].style) {  
            a[bk] = b[bk];
         } else {
            a[bk] = a[bk] || {};
            highed.merge(a[bk], b[bk]);
         }          
        });    
        return a;
    },

    /** Check if something is null or undefined
     * @memberof highed
     * @param {(String|Object|Number)} what - the value to check
     * @return {bool}
     */
    isNull: function (what) {
        return (typeof what === 'undefined' || what === null);
    },

    /** Check if something is a string 
     * @memberof highed
     * @param {(String|Object|Number)} - the value to check
     * @return {bool}
     */
    isStr: function (what) {
        return (typeof what === 'string' || what instanceof String);
    },

    /** Check if something is a number
     * @memberof highed
     * @param {(String|Object|Number)} what - the value to check
     * @return {bool}
     */
    isNum: function(what) {
        return !isNaN(parseFloat(what)) && isFinite(what);
    },

    /** Check if a value is a function
     * @memberof highed
     * @param {(String|Object|Number)} what - the value to check
     * @return {bool}
     */
    isFn: function (what) {
        return (what && (typeof what === 'function') || (what instanceof Function));
    },

    /** Check if a value is an array
     * @memberof highed
     * @param {(String|Object|Number)} what - the value to check
     * @return {bool}
     */
    isArr: function (what) {
        return (!highed.isNull(what) && what.constructor.toString().indexOf("Array") > -1);
    },

    /** Check if a value is a boolean
     * @memberof highed
     * @param {(String|Object|Number)} what - the value to check
     * @return {bool}
     */
    isBool: function (what) {
        return (what === true || what === false);
    },

    /** Check if a value is a basic type
     * @memberof highed
     * @param {(String|Object|Number)} what - the value to check
     * @return {bool} 
     */
    isBasic: function (what) {
        return !highed.isArr(what) && (highed.isStr(what) || highed.isNum(what) || highed.isBool(what) || highed.isFn(what));
    }
};

//Stateful functions
(function () {
    var logLevels = [
            'error',
            'warn',
            'notice',
            'verbose'
        ],
        currentLogLevel = 4,
        initQueue = [],
        isReady = false,
        cdnScripts = [
            "https://code.highcharts.com/stock/highstock.js",   
            "http://code.highcharts.com/adapters/standalone-framework.js",  
            "https://code.highcharts.com/highcharts-more.js",   
            "https://code.highcharts.com/highcharts-3d.js", 
            "https://code.highcharts.com/modules/data.js",  
            "https://code.highcharts.com/modules/exporting.js"
        ]
    ;

    ///////////////////////////////////////////////////////////////////////////
    
    function pollForReady() {
        if (!isReady) {
            if (document.body) {
                isReady = true;
                initQueue.forEach(function (fn) {
                    fn();
                });
            } else {
                setTimeout(pollForReady, 100);
            }
        }
    }

    pollForReady();

    ///////////////////////////////////////////////////////////////////////////

    /** Add a function to call when the document is ready
     * @memberof highed
     * @param {function} fn - the function to call
     */
    highed.ready = function (fn) {
        if (highed.isFn(fn)) {
            if (isReady) {
                fn();
            } else {
                initQueue.push(fn);
            }
        }
    };

    /** Set the current log level
     * @memberof highed
     * @param {number} level - the log level 1..4
     * @param {string} msg - the log message
     */
    highed.log = function (level) {
        var things = (Array.prototype.slice.call(arguments));
        things.splice(0, 1);

        if (level <= currentLogLevel) {
            console.log.apply(undefined, [logLevels[level - 1] + ':'].concat(things));
        }
    };

    ///////////////////////////////////////////////////////////////////////////

 //   highed.ready(function () {
        //Include the highcharts scripts
    // function tryAddScripts() {
    //     if (document.head) {
    //         cdnScripts.forEach(function (script) {
    //             var s = document.createElement('script');
    //             s.src = script;
    //             document.head.appendChild(s);
    //         });            
    //     } else {
    //         setTimeout(tryAddScripts, 10);            
    //     }
    // }

    // tryAddScripts();


    // function include(script, next) {
    //     var sc=document.createElement("script");
    //     sc.src = script;
    //     sc.type="text/javascript";
    //     sc.onload=function() {
    //         if (++next < incl.length) {
    //             include(incl[next], next);
    //         } else {
    //             loadedScripts = true;
    //         }
    //     };
    //     document.head.appendChild(sc);
    // }

    // var inc = {},
    //     incl = []
    // ; 

    // document.querySelectorAll("script").forEach(function(t) {inc[t.src.substr(0, t.src.indexOf("?"))] = 1;});

    // Object.keys(cdnScripts).forEach(function (k){
    //     if (!inc[k] && k && k.length > 0) {
    //         incl.push(k)
    //     }
    // });

    // if (incl.length > 0) { include(incl[0], 0); } else {loadedScripts = true;}
})();