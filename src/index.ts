import Common from 'ts_common_utils/lib/Common'
import Timer from 'ts_common_utils/lib/Timer'
var parseColor = require('parse-color')

export default {
	init(mode:number = FullscreenViewModes.FULL_SCREEN, backgroundCSS:string = '#000000', defaultOptions:FullscreenViewOptions | any = new FullscreenViewOptions()){
		var fullscreenView = new FullscreenView(mode, backgroundCSS, defaultOptions)
		var _window = window as any
		_window.fullscreenView = fullscreenView
	}
}

export class FullscreenViewModes{
	public static readonly FULL_SCREEN:number = 0
	public static readonly FULL_WINDOW:number = 1
}

export class FullscreenViewOptions {
	clone:boolean = true
	animate:boolean = true
	scale:number = 1
	animationProgrssionFn = (x:number) => {return Math.sin(x * Math.PI / 2)}
	backButton:HTMLElement

	constructor(){
		this.backButton = document.createElement('button')
		this.backButton.style.position = 'absolute'
		this.backButton.style.left = '0px'
		this.backButton.style.top = '0px'
		this.backButton.innerHTML = 'X'
	}

	overwrite(options:FullscreenViewOptions):FullscreenViewOptions{
		var newOptions = new FullscreenViewOptions()
		for(var key in this) {
			if(key in options){
				newOptions[key] = options[key]
			}else{
				newOptions[key] = this[key]
			}
		}
		return newOptions
	}
}

export class FullscreenView {
	private mode:number
	private visible:boolean = false

	private div1:HTMLElement
	private div2:HTMLElement
	private contentHolderDiv:HTMLElement

	private startBounds:DOMRect
	private content:HTMLElement
	private originalContentElement:HTMLElement
	private contentsDefaultParent:HTMLElement
	private backgroundColor:string
	
	private animationScale = 1
	private defaultOptions:FullscreenViewOptions
	private currentOptions:FullscreenViewOptions

	private offsetX:number = 0
	private offsetY:number = 0

	constructor(mode:number = FullscreenViewModes.FULL_SCREEN, backgroundColor:string = '#000000', defaultOptions:FullscreenViewOptions | any){
		this.defaultOptions = new FullscreenViewOptions().overwrite(defaultOptions)
		this.mode = mode

		this.div1 = document.createElement('div')
		this.div1.style.position = 'fixed'
		this.div1.style.background = backgroundColor
		this.backgroundColor = this.div1.style.background
		this.div1.style.left = '0px'
		this.div1.style.top = '0px'
		this.div1.style.width = '100%'
		this.div1.style.height = '100%'
		this.div1.style.zIndex = '1000'
		
		this.div2 = document.createElement('div')
		this.div2.style.width = '100%'
		this.div2.style.height = '100%'
		this.div2.style.display = 'flex'
		this.div2.style.justifyContent = 'center'
		this.div2.style.alignItems = 'center'
		this.div1.appendChild(this.div2)

		this.contentHolderDiv = this.div2
		
		if(this.defaultOptions.backButton){
			var _this = this
			this.defaultOptions.backButton.addEventListener('click', () => {
				if(_this.animationScale != 1)
					return
				this.toggleVisibility(false)
			})
			this.div1.appendChild(this.defaultOptions.backButton)
		}

		this.div1.addEventListener('fullscreenchange', () => this.onFullScreenChange(this))
		window.addEventListener('resize', () => this.onResize(this))
	}
	focusElement(content:HTMLElement, options:FullscreenViewOptions | any | null = null){
		if(this.visible){
			return
		}

		if(options){
			this.currentOptions = this.defaultOptions.overwrite(options)
		}else{
			this.currentOptions = this.defaultOptions
		}

		if(this.currentOptions.clone){
			if(content != this.originalContentElement){
				this.contentHolderDiv.innerHTML = ''
				this.content = content.cloneNode(true) as HTMLElement
			}
		}else{
			this.contentHolderDiv.innerHTML = ''
			this.content = content
		}
		this.startBounds = this.content.getBoundingClientRect()
		this.contentsDefaultParent = content.parentElement as HTMLElement
		this.contentHolderDiv.appendChild(this.content)
		this.originalContentElement = content
		this.toggleVisibility(true)
	}
	private toggleVisibility(on:boolean){
		if(on){
			document.body.appendChild(this.div1)
			if(this.mode == FullscreenViewModes.FULL_WINDOW){
				this.visible = true
				document.documentElement.style.overflow = "hidden"
				if(this.currentOptions.animate){
					this.animate()
				}else{
					this.onResize(this)
				}
			}else if(this.mode == FullscreenViewModes.FULL_SCREEN){
				this.goFullScreen()
			}
		}else{
			if(this.mode == FullscreenViewModes.FULL_WINDOW && this.currentOptions.animate){
				this.animate(true)
			}else{
				this.cleanup()
			}
		}
	}
	private cleanup(){
		this.visible = false
		if(this.mode == FullscreenViewModes.FULL_WINDOW){
			document.documentElement.style.overflow = ""
		}else if(this.mode == FullscreenViewModes.FULL_SCREEN){
		}
		document.body.removeChild(this.div1)
		if(!this.currentOptions.clone){
			this.contentsDefaultParent.appendChild(this.content)
		}
	}
	private animate(reverse = false){
		var _this = this
		var totalTime = 1
		var timer = new Timer(0.3)
		
		var startX = (this.startBounds.x + this.startBounds.width / 2) - this.div1.clientWidth / 2
		var startY = (this.startBounds.y + this.startBounds.height / 2) - this.div1.clientHeight / 2
	
		var endX = 0
		var endY = 0
		this.animationScale = 1
		var startScale = 1 / this.getEndScaleToFillParent()
		var endScale = 1
		var startOpacity = 0
		var endOpacity = 1
		var startColor = parseColor(this.backgroundColor).rgba
		
		function frame(dt:number){
			var prog = timer.update(dt)
			if(reverse)
				prog = 1 - prog
			
			var progress = _this.currentOptions.animationProgrssionFn(prog / totalTime)
			
			var opacity = startOpacity + (endOpacity - startOpacity) * progress
			if(_this.currentOptions.clone){
				_this.div1.style.opacity = opacity.toString()
			}else{
				_this.currentOptions.backButton.style.opacity = opacity.toString()
				var a = startColor[3] * progress
				_this.div1.style.backgroundColor = `rgba(${startColor[0]},${startColor[1]},${startColor[2]},${a})`
			}
			_this.contentHolderDiv.style.opacity = '1'
			_this.animationScale = startScale + (endScale - startScale) * progress
			_this.offsetX = startX + (endX - startX) * progress
			_this.offsetY = startY + (endY - startY) * progress
			_this.onResize(_this)
			
			if(timer.ended){
				if(reverse){
					_this.cleanup()
				}
				return true
			}
			return false
		}
		Common.framedAnimation(frame)
	}
	private goFullScreen(){
		var div = this.div1 as any
		if (div.requestFullscreen) {
			div.requestFullscreen();
		} else if (div.mozRequestFullScreen) {
			div.mozRequestFullScreen();
		} else if (div.webkitRequestFullscreen) {
			var Element = Element as any
			div.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		} else if (div.msRequestFullscreen) {
			div.msRequestFullscreen();
		}
	}
	private onFullScreenChange(_this:FullscreenView){
		_this.visible = !_this.visible
		//console.log(_this.visible)
		if(!_this.visible){
			_this.toggleVisibility(_this.visible)
		}
	}
	private onResize(_this:FullscreenView){
		if(!_this.visible){
			return
		}
		//console.log('fdhdh')
		var newScale = _this.getEndScaleToFillParent()
		_this.contentHolderDiv.style.transform = `scale(${newScale}) translate(${_this.offsetX / newScale}px, ${_this.offsetY / newScale}px)`
	}
	private getEndScaleToFillParent(){
		var newScale = this.div1.clientWidth / this.content.clientWidth
		if(newScale * this.content.clientHeight > this.div1.clientHeight){
			newScale /= (newScale * this.content.clientHeight) / this.div1.clientHeight
		}
		newScale *= this.currentOptions.scale * this.animationScale
		return newScale
	}
}