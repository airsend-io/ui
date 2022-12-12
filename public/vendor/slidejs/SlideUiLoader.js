/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(129);


/***/ }),

/***/ 129:
/***/ (function(module, exports, __webpack_require__) {

	var SlideUI = __webpack_require__(130);

	window.createSlideJS = function(){
	    var slideJS = new SlideJS();
	    slideJS.setUI(new SlideUI());

	    return slideJS;
	};


	window.slideParser = function(file, successFn, errorFn){
	    window.slideJS.parse(file, successFn, errorFn);
	};

	window.slideAfterRender = function(element, callBackFn, sheetId) {
	    window.slideJS.render(element, callBackFn, sheetId);
	};




/***/ }),

/***/ 130:
/***/ (function(module, exports, __webpack_require__) {

	// var MobileUI = require('./MobileUI');
	// var DesktopUI = require('./DesktopUI');

	var MobileUI = __webpack_require__(131);
	var DesktopUI = MobileUI;

	function UI() {
	    var _this = this;

	    this.mobileUI = null;
	    this.desktopUI = null;
	}

	UI.prototype.initialize = function(loaderInstance, options) {
	    this.loaderInstance = loaderInstance;

	    if ($.browser && $.browser.mobile) {
	        this.mobileUI = new MobileUI(this.loaderInstance, options);
	    } else {
	        this.desktopUI = new DesktopUI(this.loaderInstance, options);
	    }
	};

	UI.prototype.getMobileUIInstance = function() {
	    return this.mobileUI;
	};

	UI.prototype.getDesktopUIInstance = function() {
	    return this.desktopUI;
	};

	UI.prototype.destroy = function(callback) {
	    if (this.mobileUI) {
	        if (this.mobileUI.destroy) {
	            this.mobileUI.destroy(callback);
	        }
	    }

	    if (this.desktopUI) {
	        if (this.desktopUI.destroy) {
	            this.desktopUI.destroy(callback);
	        }
	    }

	    this.mobileUI = null;
	    this.desktopUI = null;
	};


	module.exports = UI;

/***/ }),

/***/ 131:
/***/ (function(module, exports) {

	var themeColor = '#323639';

	function DesktopUI(instance) {
	    this.jsViewer = instance;
	    this.jsElement = this.jsViewer.getElement();
	    this.fileInfo = this.jsViewer.getFileInfo();
	    this.totalPage = this.fileInfo.total;

	    this.$jsElement = $(this.jsElement);

	    this.createTemplate();
	    this.setEvent();

	    var _this = this;
	    this.jsViewer.onAfterRender(function (index) {
	        _this.setPageInfo(index);
	    });

	}

	DesktopUI.prototype = {
	    Config: {
	        logoTitle: "KUKUDOCS",
	        logoSubTitle: "Js Document Viewer",
	        class: {
	            modal: {
	                inner: "kuku-modal",
	                header: "kuku-modal-header",
	                body: "kuku-modal-body",
	                closeBtn: "kuku-modal-close-btn"
	            }
	        },

	        styles: {
	            header: {
	                wrapper: "z-index: 1000; display: block; width: 100%; height: 41px; position: relative; margin: 0; padding: 0; background: " + themeColor + "; font-family: Arial; transform: translate3d(0px, 0px, 0px); -webkit-transform: translate3d(0px, 0px, 0px); -ms-transform: translate3d(0px, 0px, 0px);",
	                logo: "float: left; width: 152px; height: 31px; padding: 5px 10px 5px 18px; background-color: " + themeColor + "; text-align: center;",
	                logoText: "font-weight: 600; font-size: 16px; color: #fff; margin: 0; padding: 0;",
	                logoSubText: "font-size: 10px; font-weight: normal; font-style: italic; color: #fff; margin: 0; padding: 0;",

	                rightMenu: "float: right !important; position: absolute; top: 0; right: 0; font-size: 10px; padding: 0 5px; color: #ffffff;",

	                buttonGroup: "float: left; margin: 0; padding-left: 0; list-style: none; border: none !important;",
	                buttonGroupItem: "float: left; display: block; position: relative; cursor: pointer;",
	                btnA: "cursor: pointer; display: block; float: left; width: 40px; height: 40px; text-align: center; margin-left: 0px; overflow: hidden; white-space: nowrap;",
	                icon: "width:20px; height:20px; margin: 10px;"
	            },

	            footer: {
	                wrapper: "z-index: 1000; display: block; position: absolute; width: 100%; height: 25px; background: " + themeColor + "; bottom: 0; margin: 0; padding: 0; font-family: Arial; ",
	                floatButton: "position: absolute; cursor: pointer; width: 40px; height: 40px; background-color: " + themeColor + "; font-size: 35px; color: #FFFFFF; text-align: center; border-radius: 50%; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; z-index: 1001; right: 20px; bottom: 50px;",
	                icon: "width:16px; height:16px; margin: 12px;"
	            },


	            sheetInfo: {
	                wrapper: "position:relative; display:inline-block; width: 70%; height: 100%; font-size: 10px;  color: #ffffff; overflow: hidden;",
	                select: "position:relative; display:inline-block; width: 70%; height: 100%; font-size: 10px;  color: #ffffff; overflow: hidden;",
	                fileName: "display:inline-block; position:absolute; padding:5px 0; font-size: 10px; color: #ffffff; text-align: right; overflow: hidden;",

	                sheetName: {
	                    wrapper: "position:absolute; top: 0; left:-100000px; margin:0; padding:0; list-style: none; left:65px;",
	                    item: "float: left; display: block; position: relative; cursor: pointer;",
	                    itemA: "cursor: pointer;display: block;float: left;min-width: 60px;height: 13px;text-align: center;margin-left: 0;overflow: hidden;white-space: nowrap;border: 1px solid #969696;background: #ffffff;color: #000000;font-size: 10px;padding: 3px;border-radius: 0 0 3px 3px; border-bottom: 3px solid #00B48C;",
	                    activeA: "border-bottom: 3px solid #00B48C;"
	                },

	                sheetMoveNode: {
	                    wrapper : "width:60px;",
	                    ul: "padding:0;list-style: none; margin:0;",
	                    li: "float: left; display: block; position: relative; cursor: pointer; margin: 0px;",
	                    btn: "cursor: pointer;display: block;float: left; width: 25px;height: 15px;text-align: center; overflow: hidden;white-space: nowrap; color: #ffffff;font-size: 12px; margin-left:3px; padding-top: 5px;"
	                }
	            },

	            modal: {
	                wrapper: "position: fixed; width: 100%; height: 100%; top: 0; left: 0; background-color: rgba(0,0,0,0.75); z-index: 10000;",
	                inner: "position: relative; margin: 0 auto; top: 10%; min-width: 500px; max-width:700px; min-height: 300px; background: #ffffff;",
	                closeBtn: "position: absolute; top: -12.5px; right: -12.5px; cursor:pointer; display: block; width: 30px; height: 30px; text-indent: -9999px; background-size: contain; background-repeat: no-repeat; background-position: center center; background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAAAXNSR0IArs4c6QAAA3hJREFUaAXlm8+K00Acx7MiCIJH/yw+gA9g25O49SL4AO3Bp1jw5NvktC+wF88qevK4BU97EmzxUBCEolK/n5gp3W6TTJPfpNPNF37MNsl85/vN/DaTmU6PknC4K+pniqeKJ3k8UnkvDxXJzzy+q/yaxxeVHxW/FNHjgRSeKt4rFoplzaAuHHDBGR2eS9G54reirsmienDCTRt7xwsp+KAoEmt9nLaGitZxrBbPFNaGfPloGw2t4JVamSt8xYW6Dg1oCYo3Yv+rCGViV160oMkcd8SYKnYV1Nb1aEOjCe6L5ZOiLfF120EjWhuBu3YIZt1NQmujnk5F4MgOpURzLfAwOBSTmzp3fpDxuI/pabxpqOoz2r2HLAb0GMbZKlNV5/Hg9XJypguryA7lPF5KMdTZQzHjqxNPhWhzIuAruOl1eNqKEx1tSh5rfbxdw7mOxCq4qS68ZTjKS1YVvilu559vWvFHhh4rZrdyZ69Vmpgdj8fJbDZLJpNJ0uv1cnr/gjrUhQMuI+ANjyuwftQ0bbL6Erp0mM/ny8Fg4M3LtdRxgMtKl3jwmIHVxYXChFy94/Rmpa/pTbNUhstKV+4Rr8lLQ9KlUvJKLyG8yvQ2s9SBy1Jb7jV5a0yapfF6apaZLjLLcWtd4sNrmJUMHyM+1xibTjH82Zh01TNlhsrOhdKTe00uAzZQmN6+KW+sDa/JD2PSVQ873m29yf+1Q9VDzfEYlHi1G5LKBBWZbtEsHbFwb1oYDwr1ZiF/2bnCSg1OBE/pfr9/bWx26UxJL3ONPISOLKUvQza0LZUxSKyjpdTGa/vDEr25rddbMM0Q3O6Lx3rqFvU+x6UrRKQY7tyrZecmD9FODy8uLizTmilwNj0kraNcAJhOp5aGVwsAGD5VmJBrWWbJSgWT9zrzWepQF47RaGSiKfeGx6Szi3gzmX/HHbihwBser4B9UJYpFBNX4R6vTn3VQnez0SymnrHQMsRYGTr1dSk34ljRqS/EMd2pLQ8YBp3a1PLfcqCpo8gtHkZFHKkTX6fs3MY0blKnth66rKCnU0VRGu37ONrQaA4eZDFtWAu2fXj9zjFkxTBOo8F7t926gTp/83Kyzzcy2kZD6xiqxTYnHLRFm3vHiRSwNSjkz3hoIzo8lCKWUlg/YtGs7tObunDAZfpDLbfEI15zsEIY3U/x/gHHc/G1zltnAgAAAABJRU5ErkJggg==');",
	                body: 'padding: 50px; font-size:12px; height:400px; overflow:auto;'
	            }
	        }
	    },
	    createTemplate: function () {
	        this.$header = $('<div style="' + this.Config.styles.header.wrapper + '"></div>');
	        this.$logo = ''; /*//FileCloud changes $('' +
	            '<div style="' + this.Config.styles.header.logo + '">' +
	            '<p style="' + this.Config.styles.header.logoText + '">' + this.Config.logoTitle + '</p>' +
	            '<p style="' + this.Config.styles.header.logoSubText + '">' + this.Config.logoSubTitle + '</p>' +
	            '</div>');*/

	        this.$menuBtns = {
	            header: {
	                extractText: $('' +
	                    '<li style="' + this.Config.styles.header.buttonGroupItem + '">' +
	                    '<a style="' + this.Config.styles.header.btnA + '">' +
	                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 63" xml:space="preserve"  preserveAspectRatio="xMinYMin meet" style="' + this.Config.styles.header.icon + '">' +
	                    '<g fill="#ffffff">' +
	                    '<path d="M57.786985310805434,30.153229847612856 l-9.055103945607536,-9.055487815375042 c-0.4859791256576899,-0.48559525589018326 -1.13433516296877,-0.7527686140716598 -1.8260684840075907,-0.7527686140716598 s-1.3397054885824038,0.26717335818147886 -1.825684614240091,0.7527686140716598 l-1.5469951630335492,1.5477629025685538 c-0.4859791256576899,0.4859791256576899 -0.75353635360667,1.13433516296877 -0.75353635360667,1.825684614240091 c0,0.6917333210388238 0.26755722794898046,1.3516054513749696 0.75353635360667,1.8379684468001587 l1.9565842049583113,1.9681002979833768 H27.20139384553893 c-1.4237729676653679,0 -2.585746753894288,1.1347190327362706 -2.585746753894288,2.5581081306341362 v2.1880576747620903 c0,1.423389097897867 1.161973786228921,2.631043386459539 2.585746753894288,2.631043386459539 h18.40079730521418 l-2.065219349161413,2.040267814273774 c-0.48636299542518946,0.48636299542518946 -0.7539202233741708,1.1220513304087059 -0.7539202233741708,1.8137846514475235 c0,0.6913494512713243 0.26755722794898046,1.333563572302369 0.7539202233741708,1.8195426979600544 l1.5469951630335492,1.5435403351260293 c0.4859791256576899,0.48636299542518946 1.13433516296877,0.7523847443041607 1.825684614240091,0.7523847443041607 c0.6917333210388238,0.0007677395350042483 1.3400893583499065,-0.2683249674839839 1.8260684840075907,-0.7543040931416749 l9.051265247932518,-9.052032987467523 c0.4875146047276974,-0.4875146047276974 0.7550718326766777,-1.138557730411292 0.7531524838391621,-1.831058790985118 C58.54205714348211,31.29178757802414 58.27449991553314,30.640744452340563 57.786985310805434,30.153229847612856 z"></path>' +
	                    '<path d="M27.05573100050693,48.675453001990874 c-1.6097819065073902,0 -3.0163837779057108,-0.3725177772353957 -4.217658901580388,-1.1175533317061812 c-0.937860858144835,-0.5532204684977171 -1.5617965657109654,-1.2740107981450466 -1.8742063897382129,-2.1633812066429705 c-0.33753898933905563,-0.8652514608870888 -0.5052351277012914,-2.9325357087245925 -0.5052351277012914,-6.2021052979377504 V24.987868349474255 h13.12285421290825 v-8.688629891680844 H20.458504304274424 V2.31100650678544 h-7.896114105264121 c-0.3606477192489118,2.8359336410686327 -1.009207483276361,5.1911299336846755 -1.9465632325707096,7.0668516499743514 c-0.9374820265069735,1.8505925509778614 -2.175377541842076,3.4370131731501496 -3.7135602687926967,4.758756757666375 c-1.5384352813758646,1.298382300181124 -3.4011504447654546,2.3078423378827297 -5.588398044594016,3.0286326675300606 v7.823504708006375 h6.1288645146168905 v19.432673973212705 c0,2.5716354350504367 0.2646770376560629,4.506833718485151 0.7930208952672092,5.804584632603164 c0.5049825732760475,1.298508577393747 1.4545872121947456,2.5598916542765773 2.848435085118228,3.7859171116251984 c1.4419594909325286,1.2014014008873 3.100610678724697,2.1027681445843296 4.97519590010077,2.7030900133901143 c1.9469420642085757,0.6490648728779401 4.182301282046181,0.9739761409547767 6.705951376300197,0.9739761409547767 c2.307589783457485,0 4.3862389804309805,-0.22894058648398982 6.237084085834086,-0.685432710113125 c1.8267261577922729,-0.4087593372579563 3.9662409712496522,-1.1900364517513051 6.417786777096409,-2.34395762069267 V45.93473237923936 C32.65574654866219,47.76234247751998 29.86805080281521,48.675453001990874 27.05573100050693,48.675453001990874 z"></path>' +
	                    '</g>' +
	                    '</svg>' +
	                    '</a>' +
	                    '</li>'),
	                extractHTMLText: $('' +
	                    '<li style="' + this.Config.styles.header.buttonGroupItem + '">' +
	                    '<a style="' + this.Config.styles.header.btnA + '">' +
	                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 63" xml:space="preserve"  preserveAspectRatio="xMinYMin meet" style="' + this.Config.styles.header.icon + '">' +
	                    '<g fill="#ffffff">' +
	                    '<path d="M57.786985310805434,30.153229847612856 l-9.055103945607536,-9.055487815375042 c-0.4859791256576899,-0.48559525589018326 -1.13433516296877,-0.7527686140716598 -1.8260684840075907,-0.7527686140716598 s-1.3397054885824038,0.26717335818147886 -1.825684614240091,0.7527686140716598 l-1.5469951630335492,1.5477629025685538 c-0.4859791256576899,0.4859791256576899 -0.75353635360667,1.13433516296877 -0.75353635360667,1.825684614240091 c0,0.6917333210388238 0.26755722794898046,1.3516054513749696 0.75353635360667,1.8379684468001587 l1.9565842049583113,1.9681002979833768 H27.20139384553893 c-1.4237729676653679,0 -2.585746753894288,1.1347190327362706 -2.585746753894288,2.5581081306341362 v2.1880576747620903 c0,1.423389097897867 1.161973786228921,2.631043386459539 2.585746753894288,2.631043386459539 h18.40079730521418 l-2.065219349161413,2.040267814273774 c-0.48636299542518946,0.48636299542518946 -0.7539202233741708,1.1220513304087059 -0.7539202233741708,1.8137846514475235 c0,0.6913494512713243 0.26755722794898046,1.333563572302369 0.7539202233741708,1.8195426979600544 l1.5469951630335492,1.5435403351260293 c0.4859791256576899,0.48636299542518946 1.13433516296877,0.7523847443041607 1.825684614240091,0.7523847443041607 c0.6917333210388238,0.0007677395350042483 1.3400893583499065,-0.2683249674839839 1.8260684840075907,-0.7543040931416749 l9.051265247932518,-9.052032987467523 c0.4875146047276974,-0.4875146047276974 0.7550718326766777,-1.138557730411292 0.7531524838391621,-1.831058790985118 C58.54205714348211,31.29178757802414 58.27449991553314,30.640744452340563 57.786985310805434,30.153229847612856 z"></path>' +
	                    '<path d="M27.05573100050693,48.675453001990874 c-1.6097819065073902,0 -3.0163837779057108,-0.3725177772353957 -4.217658901580388,-1.1175533317061812 c-0.937860858144835,-0.5532204684977171 -1.5617965657109654,-1.2740107981450466 -1.8742063897382129,-2.1633812066429705 c-0.33753898933905563,-0.8652514608870888 -0.5052351277012914,-2.9325357087245925 -0.5052351277012914,-6.2021052979377504 V24.987868349474255 h13.12285421290825 v-8.688629891680844 H20.458504304274424 V2.31100650678544 h-7.896114105264121 c-0.3606477192489118,2.8359336410686327 -1.009207483276361,5.1911299336846755 -1.9465632325707096,7.0668516499743514 c-0.9374820265069735,1.8505925509778614 -2.175377541842076,3.4370131731501496 -3.7135602687926967,4.758756757666375 c-1.5384352813758646,1.298382300181124 -3.4011504447654546,2.3078423378827297 -5.588398044594016,3.0286326675300606 v7.823504708006375 h6.1288645146168905 v19.432673973212705 c0,2.5716354350504367 0.2646770376560629,4.506833718485151 0.7930208952672092,5.804584632603164 c0.5049825732760475,1.298508577393747 1.4545872121947456,2.5598916542765773 2.848435085118228,3.7859171116251984 c1.4419594909325286,1.2014014008873 3.100610678724697,2.1027681445843296 4.97519590010077,2.7030900133901143 c1.9469420642085757,0.6490648728779401 4.182301282046181,0.9739761409547767 6.705951376300197,0.9739761409547767 c2.307589783457485,0 4.3862389804309805,-0.22894058648398982 6.237084085834086,-0.685432710113125 c1.8267261577922729,-0.4087593372579563 3.9662409712496522,-1.1900364517513051 6.417786777096409,-2.34395762069267 V45.93473237923936 C32.65574654866219,47.76234247751998 29.86805080281521,48.675453001990874 27.05573100050693,48.675453001990874 z"></path>' +
	                    '<text stroke-width="0.5" x="24.388873725420495" y="12.203723819442857" font-size="13" font-family="Helvetica, Arial, sans-serif" text-anchor="start">HTML</text>' +
	                    '</g>' +
	                    '</svg>' +
	                    '</a>' +
	                    '</li>'),


	                fullscreen: $('' +
	                    '<li style="' + this.Config.styles.header.buttonGroupItem + '">' +
	                    '<a style="' + this.Config.styles.header.btnA + '">' +
	                    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 63 63" xml:space="preserve"  preserveAspectRatio="xMinYMin meet" style="' + this.Config.styles.header.icon + '">' +
	                    '<g fill="#ffffff">' +
	                    '<path d="M18.796842008225546,12.51633946062611 l2.8179575342658323,-2.6678772754275046 c1.8829356299311009,-1.8525303911064799 1.3959653249159782,-3.9422216450450005 -1.0851021631730577,-4.522840085639954 H8.594546552057071 C6.615773609350767,5.397378463184758 5.291564648060893,5.995267079432097 5.356996722011477,8.611090585991851 L5.339483304448495,20.559376476425335 c0.5022945453827311,2.4635540705260555 2.2222580952138657,2.944200085865656 3.8269249794220395,1.0697779228054491 l3.167982643614863,-2.9940646775380335 l10.013053249724036,10.00867489533329 c0.8698330722947447,0.8676438950993718 2.2808793956677347,0.8698330722947447 3.1485232907671064,0.004378354390745358 l3.1463341135717338,-3.1463341135717338 c0.8676438950993718,-0.8654547179039992 0.8654547179039992,-2.278690218472362 -0.002189177195372681,-3.1463341135717338 C28.6401124043529,22.35547474427332 18.796842008225546,12.51633946062611 18.796842008225546,12.51633946062611 zM25.4351569903273,36.43018141714546 c-0.8632655407086263,-0.8654547179039992 -2.2721226868862443,-0.8654547179039992 -3.137577404790243,0.004378354390745358 l-9.982648010899416,9.973891302117925 l-3.1594691767439698,-2.9896863231472883 c-1.5980993526220568,-1.8700438086694622 -3.3136845480624446,-1.3893977933298605 -3.815979093445177,1.0653995684147037 L5.358942657296253,56.40423414772579 c-0.0629996548446138,2.6004992661921453 1.2524525976637693,3.2049554140256022 3.229036363174701,3.272333423260961 h11.906934765632002 c2.4701216021121724,-0.5849967949856996 2.957091907127295,-2.665688098232132 1.0807238087823123,-4.507515845272345 l-2.8092008254843406,-2.659363808556611 l9.806540867627213,-9.81091922201796 c0.8654547179039992,-0.8654547179039992 0.8676438950993718,-2.2743118640816165 0.002189177195372681,-3.13538822759487 C28.574923572312915,39.56338046754496 25.4351569903273,36.43018141714546 25.4351569903273,36.43018141714546 zM39.56216067397779,28.645953794221413 c0.8632655407086263,0.8654547179039992 2.2743118640816165,0.8632655407086263 3.139766581985615,-0.004378354390745358 l9.984837188094787,-10.00867489533329 l3.1594691767439698,2.9940646775380335 c1.59372099823131,1.8744221630602074 3.3093061936717003,1.3937761477206059 3.8116007390544313,-1.0697779228054491 l-0.017513417562981446,-11.948285890433484 C59.703563839048826,5.993077902236724 58.3834899902391,5.395189285989386 56.411771062940105,5.323432922363281 h-11.915691474413492 c-2.4723107793075454,0.5828076177903275 -2.9463892630610284,2.6722556298182503 -1.0697779228054491,4.522840085639954 l2.813579179875086,2.670066452622878 L36.42677244638293,22.351096389882574 c-0.8654547179039992,0.8676438950993718 -0.8654547179039992,2.2808793956677347 0,3.1463341135717338 C36.42677244638293,25.497430503454307 39.56216067397779,28.645953794221413 39.56216067397779,28.645953794221413 zM55.85499032958366,43.416575573311476 l-3.150712467962479,2.9896863231472883 l-9.950053594879423,-9.973891302117925 c-0.8654547179039992,-0.8698330722947447 -2.2721226868862443,-0.8698330722947447 -3.1310098732041247,-0.004378354390745358 l-3.1288206960087517,3.1331990503994978 c-0.8610763635132533,0.8610763635132533 -0.8588871863178806,2.270176751601468 0.004378354390745358,3.13538822759487 l9.778081564087367,9.806540867627213 l-2.807011648288968,2.663742162947357 c-1.8678546314740898,1.845962859520362 -1.3893977933298605,3.929086581872763 1.0741562771961946,4.507515845272345 h11.878718704002752 c1.9678270567294416,-0.06737800923535912 3.2898468408239423,-0.6718341570688162 3.220279654393211,-3.272333423260961 l0.017513417562981446,-11.920069828804237 C59.15772899166924,42.02912371526639 57.44652215061959,41.54872094183738 55.85499032958366,43.416575573311476 z"></path>' +
	                    '</g>' +
	                    '</svg>' +
	                    '</a>' +
	                    '</li>')
	            },

	            footer: {
	                main: $('' +
	                    '<div style="' + this.Config.styles.footer.floatButton + '">' +
	                    '<a style="' + this.Config.styles.header.btnA + '">' +
	                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 63" xml:space="preserve" style="' + this.Config.styles.footer.icon + '">' +
	                    '<g fill="#ffffff">' +
	                    '<path d="M56.588499999999996,25 H40 H25 H8.4115 C4.336,25 1,28.423000000000002 1,32.5 s3.3360000000000003,7.5 7.4115,7.5 H25 h15 h16.5885 C60.664,40 64,36.577 64,32.5 S60.664,25 56.588499999999996,25 z" stroke-dasharray="none" stroke="null"></path>' +
	                    '<path d="M56.588499999999996,3 H40 H25 H8.4115 C4.336,3 1,6.423000000000002 1,10.5 s3.3360000000000003,7.5 7.4115,7.5 H25 h15 h16.5885 C60.664,18 64,14.576999999999998 64,10.5 S60.664,3 56.588499999999996,3 z" stroke-dasharray="none" stroke="null"></path>' +
	                    '<path d="M56.588499999999996,47 H40 H25 H8.4115 C4.336,47 1,50.423 1,54.5 s3.3360000000000003,7.5 7.4115,7.5 H25 h15 h16.5885 C60.664,62 64,58.577 64,54.5 S60.664,47 56.588499999999996,47 z" stroke-dasharray="none" stroke="null"></path>' +
	                    '</g>' +
	                    '</svg>' +
	                    '</a>' +
	                    '</div>'),
	                next: $('' +
	                    '<div style="' + this.Config.styles.footer.floatButton + '">' +
	                    '<a style="' + this.Config.styles.header.btnA + '">' +
	                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 63" xml:space="preserve" style="' + this.Config.styles.footer.icon + '">' +
	                    '<g fill="#ffffff">' +
	                    '<path d="M21.2898843031987,63.75444973065837 c-1.9179103686106416,0 -3.837179030683474,-0.707670893800386 -5.336735012939952,-2.13116244217429 c-3.0996256807149325,-2.9474968129497823 -3.223230385774117,-7.8509362114514945 -0.2770918662865234,-10.951920185628616 l17.32910799060522,-18.225581675649853 L15.693715238980683,14.346525043539314 C12.736710371795581,11.256407417059705 12.845373848770684,6.35296801855799 15.936849768712488,3.3946048579107004 c3.092834213403989,-2.9583631606472927 7.994915318443511,-2.848341390209997 10.951920185628616,0.24313452973180238 l22.4186335934268,23.434637103144055 c2.8578494444453195,2.9882456168154476 2.8632826182940745,7.694732463299779 0.017657815008454952,10.692486134350547 L26.907786062811745,61.34619542219756 C25.382422504773672,62.94490682719382 23.34090743110385,63.75444973065837 21.2898843031987,63.75444973065837 z"></path>' +
	                    '</g>' +
	                    '</svg>' +
	                    '</a>' +
	                    '</div>'),
	                prev: $('<div style="' + this.Config.styles.footer.floatButton + '">' +
	                    '<a style="' + this.Config.styles.header.btnA + '">' +
	                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 63" xml:space="preserve" style="' + this.Config.styles.footer.icon + '">' +
	                    '<g fill="#ffffff">' +
	                    '<path d="M21.2898843031987,63.75444973065837 c-1.9179103686106416,0 -3.837179030683474,-0.707670893800386 -5.336735012939952,-2.13116244217429 c-3.0996256807149325,-2.9474968129497823 -3.223230385774117,-7.8509362114514945 -0.2770918662865234,-10.951920185628616 l17.32910799060522,-18.225581675649853 L15.693715238980683,14.346525043539314 C12.736710371795581,11.256407417059705 12.845373848770684,6.35296801855799 15.936849768712488,3.3946048579107004 c3.092834213403989,-2.9583631606472927 7.994915318443511,-2.848341390209997 10.951920185628616,0.24313452973180238 l22.4186335934268,23.434637103144055 c2.8578494444453195,2.9882456168154476 2.8632826182940745,7.694732463299779 0.017657815008454952,10.692486134350547 L26.907786062811745,61.34619542219756 C25.382422504773672,62.94490682719382 23.34090743110385,63.75444973065837 21.2898843031987,63.75444973065837 z" transform="rotate(-180 32.5,32.5) "></path>' +
	                    '</g>' +
	                    '</svg>' +
	                    '</a>' +
	                    '</div>'),

	                zoomOut: $('' +
	                    '<div style="' + this.Config.styles.footer.floatButton + '">' +
	                    '<a style="' + this.Config.styles.header.btnA + '">' +
	                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 65 65" xml:space="preserve" style="' + this.Config.styles.footer.icon + '">' +
	                    '<g fill="#ffffff">' +
	                    '<path d="M56.97085819470882,24.880952835083008 H40.11904835700989 V8.02914299738407 C40.11904835700989,3.8889524440765384 36.64171495890617,0.5 32.50000059604645,0.5 s-7.61904776096344,3.3889524440765384 -7.61904776096344,7.529142997384071 V24.880952835083008 H8.02914299738407 C3.8889524440765384,24.880952835083008 0.5,28.35828623318672 0.5,32.50000059604645 s3.3889524440765384,7.61904776096344 7.529142997384071,7.61904776096344 H24.880952835083008 v16.851809837698934 C24.880952835083008,61.111048748016366 28.35828623318672,64.5000011920929 32.50000059604645,64.5000011920929 s7.61904776096344,-3.3889524440765384 7.61904776096344,-7.529142997384071 V40.11904835700989 h16.851809837698934 C61.111048748016366,40.11904835700989 64.5000011920929,36.64171495890617 64.5000011920929,32.50000059604645 S61.111048748016366,24.880952835083008 56.97085819470882,24.880952835083008 z"></path>' +
	                    '</g>' +
	                    '</svg>' +
	                    '</a>' +
	                    '</div>'),

	                zoomIn: $('' +
	                    '<div style="' + this.Config.styles.footer.floatButton + '">' +
	                    '<a style="' + this.Config.styles.header.btnA + '">' +
	                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 63 63" xml:space="preserve" style="' + this.Config.styles.footer.icon + '">' +
	                    '<g fill="#ffffff">' +
	                    '<path d="M56.588499999999996,25 H40 H25 H8.4115 C4.336,25 1,28.423000000000002 1,32.5 s3.3360000000000003,7.5 7.4115,7.5 H25 h15 h16.5885 C60.664,40 64,36.577 64,32.5 S60.664,25 56.588499999999996,25 z"></path>' +
	                    '</g>' +
	                    '</svg>' +
	                    '</a>' +
	                    '</div>')
	            }
	        };

	        this.$modal = $('' +
	            '<div style="'+this.Config.styles.modal.wrapper+'">' +
	            '<div class="'+this.Config.class.modal.inner+'" style="'+this.Config.styles.modal.inner+'">' +
	            '<div class="'+this.Config.class.modal.header+'">' +
	            '<a class="'+this.Config.class.modal.closeBtn+'" style="'+this.Config.styles.modal.closeBtn+'"></a>' +
	            '</div>' +
	            '<div class="'+this.Config.class.modal.body+'" style="'+this.Config.styles.modal.body+'"></div>' +
	            '</div>' +
	            '</div>');



	        /** Header Menu Setting **/
	        var _this = this;
	        if (this.$logo) {
	            this.$header.append(this.$logo);
	        }

	        var $menuWrapper = $('<div></div>');
	        var $menu = $('<div style="' + this.Config.styles.header.rightMenu + '"></div>');
	        var $menuGroup = $('<ul style="' + this.Config.styles.header.buttonGroup + '"></ul>');
	        $.each(this.$menuBtns.header, function () {
	            $menuGroup.append(this);
	        });
	        $menu.append($menuGroup);
	        $menuWrapper.append($menu);

	        this.$header.append($menu);

	        /** Footer Menu Setting **/
	        this.$footer = $('<div style="' + this.Config.styles.footer.wrapper + '"></div>');
	        var $fileName = $('<div style="'+this.Config.styles.sheetInfo.fileName+'"><span style="margin:5px;">' + this.fileInfo.fileName + '</span></div>');
	        this.$pageInfo = $('<div style="' + this.Config.styles.header.rightMenu + ' padding:5px;"></div>');

	        this.$footer.append($fileName);
	        this.$footer.append(this.$pageInfo);
	        $.each(this.$menuBtns.footer, function (key, value) {
	            if (value) {
	                if (key !== 'main') {
	                    value.hide();
	                }
	                _this.$footer.append(value);
	            }
	        });


	        this.$modal.find('.' + this.Config.class.modal.closeBtn).click(function(){
	            _this.$modal.hide();
	        });
	        this.$modal.hide();


	        this.$jsElement.before(this.$header);
	        this.$jsElement.after(this.$footer);

	        $('body').append(this.$modal);
	    },

	    setEvent: function () {
	        var _this = this;
	        $.each(this.$menuBtns.header, function (key) {
	            $(this).children('a').on('touchstart mousedown', (function (_key) {
	                return function (e) {
	                    e.stopPropagation();
	                    e.preventDefault();

	                    _this._clickButton(this, _key);

	                }
	            })(key));
	        });
	        $.each(this.$menuBtns.footer, function (key) {
	            $(this).children('a').on('touchstart mousedown', (function (_key) {
	                return function (e) {
	                    e.stopPropagation();
	                    e.preventDefault();

	                    _this._clickButton(this, _key);

	                }
	            })(key));
	        });

	    },

	    _clickButton: function (element, type) {
	        switch (type) {
	            case 'extractText':
	                this.extractText();
	                break;
	            case 'extractHTMLText':
	                this.extractHTMLText();
	                break;
	            case 'fullscreen' :
	                this.fullscreen();
	                break;
	            case 'main' :
	                this.mainButtonTouch();
	                break;
	            case 'next' :
	                this.nextPage();
	                break;
	            case 'prev' :
	                this.prevPage();
	                break;
	            case 'zoomOut' :
	                this.zoomOut();
	                break;
	            case 'zoomIn' :
	                this.zoomIn();
	                break;

	        }
	    },

	    setPageInfo: function (index) {
	        this.$pageInfo.html('<span>' + (index + 1) + '/' + this.totalPage + '</span>');
	    },

	    fullscreen: function (e) {
	        var elem = this.jsElement;

	        if (this.isFullScreen()) {
	            if (document.exitFullscreen) {
	                document.exitFullscreen();

	            } else if (document.webkitExitFullscreen) {
	                document.webkitExitFullscreen();

	            } else if (document.webkitCancelFullScreen) {
	                document.webkitCancelFullScreen();

	            } else if (document.mozCancelFullScreen) {
	                document.mozCancelFullScreen();

	            } else if (document.msExitFullscreen) {
	                document.msExitFullscreen();
	            }
	        } else {
	            if (elem.requestFullscreen) {
	                elem.requestFullscreen();

	            } else if (elem.mozRequestFullScreen) {
	                elem.mozRequestFullScreen()

	            } else if (elem.webkitRequestFullscreen) {
	                elem.webkitRequestFullscreen();

	            } else if (elem.msRequestFullscreen) {
	                elem.msRequestFullscreen();

	            } else {
	                //console.log("Not Support FullScreen");
	            }
	        }
	    },

	    nextPage: function(){
	        this.jsViewer.nextPage();
	    },

	    prevPage: function(){
	        this.jsViewer.prevPage();
	    },

	    zoomOut: function(){
	        var currentZoom = this.jsViewer.getZoom();
	        this.jsViewer.setZoom(currentZoom + 1);
	    },

	    zoomIn: function(){
	        var currentZoom = this.jsViewer.getZoom();
	        this.jsViewer.setZoom(currentZoom - 1);
	    },


	    isFullScreen: function () {
	        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement || document.mozFullScreenElement || document.msFullscreenElement);
	    },

	    extractText: function(){
	        var _this = this;

	        var $modalBody = _this.$modal.find('.' + _this.Config.class.modal.body);
	        this.jsViewer.extractText(true, function(textes){
	            $modalBody.empty();

	            var textString = textes;
	            if (textString instanceof Array) {
	                var _text = '';
	                $.each(textString, function(){
	                    _text += this;
	                });
	                textString = _text;
	            }
	            var htmlString = textString;
	            htmlString = htmlString.replace(new RegExp('\r?\n','g'), '<br />');
	            $modalBody.append(htmlString);
	            _this.$modal.show();
	        });
	    },

	    extractHTMLText: function(){
	        var _this = this;

	        var $modalBody = _this.$modal.find('.' + _this.Config.class.modal.body);
	        this.jsViewer.extractHTMLText(true, function(htmls){
	            $modalBody.empty();
	            if (htmls instanceof Array) {
	                var _text = '';
	                $.each(htmls, function(){
	                    _text += this;
	                });
	                htmls = _text;
	            }
	            var htmlString = htmls;
	            $modalBody.html(htmlString);
	            _this.$modal.show();
	        });
	    },

	    mainButtonTouch: function () {
	        var action = 'change';
	        if (this.$menuBtns.footer.main.hasClass('open')) {
	            action = '';
	            this.moveButtons(this.$menuBtns.footer.next, 50, action);
	            this.moveButtons(this.$menuBtns.footer.prev, 50, action);
	            this.moveButtons(this.$menuBtns.footer.zoomOut, 50, action);
	            this.moveButtons(this.$menuBtns.footer.zoomIn, 50, action);

	            this.$menuBtns.footer.main.find('g').html(
	                '<path d="M56.588499999999996,25 H40 H25 H8.4115 C4.336,25 1,28.423000000000002 1,32.5 s3.3360000000000003,7.5 7.4115,7.5 H25 h15 h16.5885 C60.664,40 64,36.577 64,32.5 S60.664,25 56.588499999999996,25 z" stroke-dasharray="none" stroke="null"></path>' +
	                '<path d="M56.588499999999996,3 H40 H25 H8.4115 C4.336,3 1,6.423000000000002 1,10.5 s3.3360000000000003,7.5 7.4115,7.5 H25 h15 h16.5885 C60.664,18 64,14.576999999999998 64,10.5 S60.664,3 56.588499999999996,3 z" stroke-dasharray="none" stroke="null"></path>' +
	                '<path d="M56.588499999999996,47 H40 H25 H8.4115 C4.336,47 1,50.423 1,54.5 s3.3360000000000003,7.5 7.4115,7.5 H25 h15 h16.5885 C60.664,62 64,58.577 64,54.5 S60.664,47 56.588499999999996,47 z" stroke-dasharray="none" stroke="null"></path>'
	            );

	            this.$menuBtns.footer.main.removeClass('open');
	        } else {
	            $.each(this.$menuBtns.footer, function (key, value) {
	                if (value && key !== 'main') {
	                    value.show();
	                }
	            });

	            this.moveButtons(this.$menuBtns.footer.next, 250, action);
	            this.moveButtons(this.$menuBtns.footer.prev, 200, action);
	            this.moveButtons(this.$menuBtns.footer.zoomOut, 150, action);
	            this.moveButtons(this.$menuBtns.footer.zoomIn, 100, action);

	            this.$menuBtns.footer.main.find('g').html(
	                '<path d="M45.361877472758295,32.50024811834097 l13.902431874096393,-13.902431874096393 c0.8831252442598347,-0.8822971073091034 1.3240253568291664,-1.9540719489455225 1.3240253568291664,-3.2154901522994046 c0,-1.2610869485735894 -0.442059504300356,-2.3326961628198624 -1.3240253568291664,-3.2154901522994046 L52.83349466964603,5.73535875287652 C51.95086630755663,4.852896018177271 50.87925709331035,4.4114990234375 49.618501399517065,4.4114990234375 c-1.2615838307440281,0 -2.3328617902100093,0.4413969947397711 -3.215987034469843,1.3238597294390204 L32.50024811834097,19.637790626972915 L18.59765061685443,5.73535875287652 C17.715519136935473,4.852896018177271 16.64374429529905,4.4114990234375 15.382160464555025,4.4114990234375 c-1.2605900664031504,0 -2.3325305354297163,0.4413969947397711 -3.2154901522994046,1.3238597294390204 L5.735524380266666,12.166835939645768 C4.8532272729575645,13.048967419564724 4.4114990234375,14.121239143371582 4.4114990234375,15.38232609194517 c0,1.261418203353882 0.44123136734962487,2.3326961628198624 1.3240253568291664,3.2154901522994046 l13.902266246706247,13.902431874096393 L5.735524380266666,46.402679992437356 C4.8532272729575645,47.28563960930705 4.4114990234375,48.35691756877303 4.4114990234375,49.618667026907204 c0,1.2604244390130044 0.44123136734962487,2.3323649080395703 1.3240253568291664,3.214827642738819 l6.4313115593791,6.430980304598809 c0.882793989479542,0.8831252442598347 1.9549000858962535,1.3240253568291664 3.2154901522994046,1.3240253568291664 c1.261418203353882,0 2.3326961628198624,-0.442059504300356 3.2154901522994046,-1.3240253568291664 l13.90259750148654,-13.902431874096393 l13.903425638437271,13.902431874096393 c0.8824627346992493,0.8831252442598347 1.953243811994791,1.3240253568291664 3.215987034469843,1.3240253568291664 c1.2605900664031504,0 2.3323649080395703,-0.442059504300356 3.2149932701289656,-1.3240253568291664 l6.429655285477638,-6.430980304598809 c0.8831252442598347,-0.8818002251386644 1.3240253568291664,-1.954403203725815 1.3240253568291664,-3.214827642738819 c0,-1.2617494581341744 -0.4409001125693322,-2.333027417600155 -1.3240253568291664,-3.215987034469843 L45.361877472758295,32.50024811834097 z"></path>'
	            );

	            this.$menuBtns.footer.main.addClass('open');
	        }
	    },
	    viewButton: function (action) {
	        this.moveButtons(this.$menuBtns.footer.next, 250, action);
	        this.moveButtons(this.$menuBtns.footer.prev, 200, action);
	        this.moveButtons(this.$menuBtns.footer.zoomOut, 150, action);
	        this.moveButtons(this.$menuBtns.footer.zoomIn, 100, action);
	    },

	    moveButtons: function ($button, position, action) {
	        if (!$button) {
	            return;
	        }
	        if (action === 'change') {
	            $button.animate({
	                bottom: position,
	                opacity: 1
	            }, "fast");
	        } else {
	            $button.animate({
	                bottom: position,
	                opacity: 0
	            }, "fast");

	            $button.fadeOut('fast');
	        }
	    },

	    destroy : function(callback){
	        this.$logo.remove();
	        this.$header.remove();
	        this.$footer.remove();
	        this.$modal.remove();

	        this.$logo = null;
	        this.$header = null;
	        this.$footer = null;
	        this.$modal = null;
	        this.fileInfo = null;
	        this.totalPage = null;
	        this.$jsElement = null;

	        this.jsViewer = null;

	        delete this.$menuBtns;

	        if (callback) {
	            callback();
	        }
	    }
	};

	module.exports = DesktopUI;

/***/ })

/******/ });
