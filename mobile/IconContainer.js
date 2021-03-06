define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/dom-construct",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase",
	"./IconItem", // to load IconItem for you (no direct references)
	"./Heading",
	"./View"
], function(array, declare, lang, win, domConstruct, Contained, Container, WidgetBase, IconItem, Heading, View){

	// module:
	//		dojox/mobile/IconContainer

	return declare("dojox.mobile.IconContainer", [WidgetBase, Container, Contained],{
		// summary:
		//		A container widget which can hold multiple icons.
		// description:
		//		IconContainer is a container widget which can hold multiple
		//		icons. Each icon must be a subclass of dojox/mobile/IconItem
		//		and can be associated with a panel which opens when touching
		//		the icon.

		// defaultIcon: String
		//		The default fallback icon, which is displayed only when the
		//		specified icon has failed to load.
		defaultIcon: "",

		// transition: [const] String
		//		A type of animated transition effect. You can choose from the
		//		standard transition types: "slide", "fade", "flip", or from the
		//		extended transition types: "cover", "coverv", "dissolve",
		//		"reveal", "revealv", "scaleIn", "scaleOut", "slidev",
		//		"swirl", "zoomIn", "zoomOut", "cube", and "swap". If "none" is
		//		specified, the transition occurs immediately without animation. If
		//		"below" is specified, the application contents are displayed
		//		below the icons. The default value is "below". Note that changing 
		//		the value of the property after the widget creation has no effect.
		transition: "below",

		// pressedIconOpacity: Number
		//		The opacity of the pressed icon image. The default value is 0.4.
		pressedIconOpacity: 0.4,

		// iconBase: String
		//		The default icon path for child items.
		iconBase: "",

		// iconPos: String
		//		The default icon position for child items.
		iconPos: "",

		// back: String
		//		A label for the navigational control.
		back: "Home",

		// label: String
		//		A title text of the heading.
		label: "My Application",

		// single: Boolean
		//		If true, only one icon content can be opened at a time.
		single: false,

		// editable: [const] Boolean
		//		If true, the icons can be removed or reordered. You can enter
		//		into edit mode by pressing on a child IconItem until it starts shaking.
		//		The default value is false. Note that changing the value of the property after
		//		the widget creation has no effect.
		editable: false,

		// tag: String
		//		A name of html tag to create as domNode.
		tag: "ul",

		/* internal properties */	
		baseClass: "mblIconContainer",
		editableMixinClass: "dojox/mobile/_EditableIconMixin",
		iconItemPaneContainerClass: "dojox/mobile/Container",
		iconItemPaneContainerProps: null,
		iconItemPaneClass: "dojox/mobile/_IconItemPane",
		iconItemPaneProps: null,

		buildRendering: function(){
			this.domNode = this.containerNode = this.srcNodeRef || domConstruct.create(this.tag);
			// _terminator is used to apply the clear:both style to terminate floating icons.
			this._terminator = domConstruct.create(this.tag === "ul" ? "li" : "div",
				{className:"mblIconItemTerminator"}, this.domNode);
			this.inherited(arguments);
		},

		postCreate: function(){
			if(this.editable && !this.startEdit){ // if editable is true but editableMixinClass is not inherited
				require([this.editableMixinClass], lang.hitch(this, function(module){
					declare.safeMixin(this, new module());
					this.set("editable", this.editable);
				}));
			}
		},

		startup: function(){
			if(this._started){ return; }

			require([this.iconItemPaneContainerClass], lang.hitch(this, function(module){
				this.paneContainerWidget = new module(this.iconItemPaneContainerProps);
				if(this.transition === "below"){
					domConstruct.place(this.paneContainerWidget.domNode, this.domNode, "after");
				}else{
					var view = this.appView = new View({id:this.id+"_mblApplView"});
					var _this = this;
					view.onAfterTransitionIn = function(){
						_this._opening._open_1();
					};
					view.domNode.style.visibility = "hidden";
					var heading = view._heading
						= new Heading({back: this.back,
										label: this.label,
										moveTo: this.domNode.parentNode.id,
										transition: this.transition == "zoomIn" ? "zoomOut" : this.transition});
					view.addChild(heading);
					view.addChild(this.paneContainerWidget);

					var target;
					for(var w = this.getParent(); w; w = w.getParent()){
						if(w instanceof View){
							target = w.domNode.parentNode;
							break;
						}
					}
					if(!target){ target = win.body(); }
					target.appendChild(view.domNode);

					view.startup();
				}
			}));

			this.inherited(arguments);
		},

		closeAll: function(){
			// summary:
			//		Closes all the icon items.
			array.forEach(this.getChildren(), function(w){
				w.close(true); // disables closing animation
			}, this);
		},

		addChild: function(widget, /*Number?*/insertIndex){
			this.inherited(arguments);
			// #16597: if removeChild(item) was called to remove the item, it also removes the paneWidget from its container,
			// But then calling addChild(item) again does not re-add it as it should: it was added the first time through startup
			// called by addChild, but startup is not called any more the subsequent times.
			// So we add the pane explicitly if it is orphan.
			if(this._started && widget.paneWidget && !widget.paneWidget.getParent()){
				this.paneContainerWidget.addChild(widget.paneWidget, insertIndex);
			}
			this.domNode.appendChild(this._terminator); // to ensure that _terminator is always the last node
		},

		removeChild: function(/*Widget|Number*/widget){
			var index = (typeof widget == "number") ? widget : widget.getIndexInParent();
			this.paneContainerWidget.removeChild(index);
			this.inherited(arguments);
		},	

		_setLabelAttr: function(/*String*/text){
			// tags:
			//		private
			if(!this.appView){ return; }
			this.label = text;
			var s = text;
			this.appView._heading.set("label", s);
		}
	});
});
