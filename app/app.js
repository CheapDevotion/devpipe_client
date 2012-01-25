/*jslint undef: true, unparam: true, sloppy: true, maxerr: 50, indent: 4 */

var app = new Ext.Application({
	name : 'devpipe',
	profiles: {
	    portraitPhone: function () {
	        return Ext.is.Phone && Ext.orientation === 'portrait';
	    },
	    landscapePhone: function () {
	        return Ext.is.Phone && Ext.orientation === 'landscape';
	    },
	    portraitTablet: function () {
	        return !Ext.is.Phone && Ext.orientation === 'portrait';
	    },
	    landscapeTablet: function () {
	        return !Ext.is.Phone && Ext.orientation === 'landscape';
	    }
	},
    launch: function () {
		var viewport, data, page, menu, menuList, menuButton, pageToolbar, listToolbar, addProject, backButton, currentRecord, deleteButton, socket, inspector, showInspector;
		
		//Setup the data store. One record per project.
		data = new Ext.data.Store({
		    model: Ext.regModel('', {
				fields: [
		            {name: 'id', type: 'int'},
		            {name: 'project', type: 'string'},
					{name: 'content'},
				],
				proxy: {
					type: 'localstorage',
					id  : 'devpipe-projects'
				}
			}),
			data: [],
			groupField: 'project',
			storeId: 'projects'

		});


		data.load();

		viewport = new Ext.Panel({
			fullscreen: true,
			layout: 'card'
		});


		page = new Ext.Panel({
			cls: 'page',
			styleHtmlContent: true,
			scroll: 'vertical'
		});

		menuList = new Ext.List({
		    store: data,
		    itemTpl: '{project}',
		    allowDeselect: false,
		    singleSelect: true
		});
		
		//This event is called when the user selects a new list item - we update the page accordingly.
		menuList.addListener('selectionchange', function (model, records) {
		    if (records[0]) {
				var content = "";
				deleteButton.show();
				currentRecord = records[0];
		        viewport.setActiveItem(page, {type: 'slide', direction: 'left'});
				pageToolbar.setTitle(records[0].data.project);
				for (i=0;i<records[0].data.content.length;i++){
					content += records[0].data.content[i].text;
				}
		        page.update(content);
				if (app.getProfile() === 'portraitPhone') {
					backButton.show();
				}
		    }
		});

		// a wrapper around the menu list
		menu = new Ext.Panel({
		    items: [menuList],
		    layout: 'fit',
		    width: 300,
		    dock: 'left',
		});

		backButton = new Ext.Button({
		    ui: 'back',
		    text: 'Back'
		});

		backButton.addListener('tap', function () {
		    viewport.setActiveItem(menu, {type: 'slide', direction: 'right'});
		    this.hide();
		});

		deleteButton = new Ext.Button({
			text: 'Delete Project'
		});

		deleteButton.hide();

		deleteButton.addListener('tap', function () {
			Ext.Msg.show({
				title: 'Delete Project',
				msg: 'Are you sure you want to delete this project?',
				buttons : [{
					itemId: 'ok',
					text: 'Sure',
					ui: 'action'
				}, {
					itemId : 'cancel',
					text   : 'Cancel'
				}],
				fn: function (text, btn) {
					if (text === 'ok') {
						data.remove(currentRecord);
						data.sync();
						data.save();

						//Update our page to be the start page once again...
						viewport.setActiveItem(page, {type: 'slide', direction: 'right'});
						page.update("<h1>Welcome to DevPipe</h1><br /><p>Here we can have info about the app.</p>");
						pageToolbar.setTitle("Dev Pipe");
						deleteButton.hide();

					}
				}
			});
		});

		// a button that toggles the menu when it is floating
		menuButton = new Ext.Button({
		    text: 'Projects',
		});

		// menu button toggles (floating) menu
		menuButton.addListener('tap', function () {
		    menu.showBy(this);
		});

		pageToolbar = new Ext.Toolbar({
		    ui: 'light',
		    title: 'Dev Pipe',
		    items: [backButton, menuButton, {xtype: 'spacer'}, deleteButton]
		});

		listToolbar = new Ext.Toolbar({
		    ui: 'light',
		    title: 'Projects',
		    items: []
		});

		inspector = new Ext.Panel({
			cls: 'inspector-panel',
		    floating: true,
			height: 400,
			scroll: 'both',
			dockedItems: [{xtype: 'toolbar', title: 'Object Inspector'}]
		});
		inspector.hide();
		
		//Globally accessible function for showing the inspected. Couldn't figure out a better way...
		app.showInspector = function (caller) {
			var object, content = "<ul class='inspector'>", depth = 0, lastDepth = 0;
			object = unescape(caller.getAttribute('object'));
			object = JSON.parse(object);
			console.log(object);
			traverse(object, process);
			content += "</ul>";
			inspector.showBy(caller);
			inspector.update(content);

			//These two functions convert an object to a list. A little rough, but gets the job done.
			function process(key, value) {
			    lastDepth = depth;
				if (typeof (value) === "object") {
					content += "<li><strong style='color:red'>" + key + "</strong></li>";
					content += "<ul>";
				} else {
					if (depth === 1 && lastDepth > 1) {
						content += "</ul>";
					}
					content += "<li><strong>" + key + "</strong>: " + value + "</li>";
				}
			};
			function traverse(object, func) {
			    for (o=0;o<object.length;o++) {
					depth++;
			        func.apply(this,[o,object[o]]);  
			        if (typeof (object[o]) === "object") {
			            //going on step down in the object tree!!
			            traverse(object[o], func);
			        } else {
						depth--;
					}
			    }
			};
		};

		page.addDocked(pageToolbar);
		menu.addDocked(listToolbar);
		viewport.setActiveItem(page);
		page.update("<h1>Welcome to DevPipe</h1><br /><p>Here we can have info about the app.</p>");

		// add profile behaviors for relevant controls

		viewport.setProfile = function (profile) {
		    if (profile === 'portraitPhone') {
		        this.setActiveItem(menu);
		    } else if (profile === 'landscapePhone') {
		        this.remove(this.menu, false);
		        this.setActiveItem(page);
		    } else if (profile === 'portraitTablet') {
		        this.removeDocked(menu, false);
		    } else if (profile === 'landscapeTablet') {
		        this.addDocked(menu);
		    }
		};

		menu.setProfile = function (profile) {
		    if (profile === "landscapePhone" || profile === "portraitTablet") {
		        this.hide();
		        if (this.rendered) {
		            this.el.appendTo(document.body);
		        }
		        this.setFloating(true);
		        this.setSize(300, 500);
		    } else {
		        this.setFloating(false);
		        this.show();
		    }

			if (profile === "landscapePhone") {
				//Make the list a little smaller for iPhone
				this.setSize(250, 200);
			}
		};

		menuButton.setProfile = function (profile) {
		    if (profile === "landscapePhone" || profile === "portraitTablet") {
		        this.show();
		    } else {
		        this.hide();
		    }
		};

		backButton.setProfile = function (profile) {
		    if (profile === 'portraitPhone' && viewport.showingPage) {
		        this.show();
		    } else {
		        this.hide();
		    }
		};

		// Create SocketIO instance, connect
		socket = io.connect('http://' + ip + ':1001');
		// Add a connect listener
		socket.on('pipe', function (message) {
			var timestamp, record, contentString, clickFunction, content, text;
			//Build timestamp for tagging message
			timestamp =  "[" + new Date().toUTCString() + "]";
			contentString = "<div class='message'><div class='timestamp'>" + timestamp + "</div>";
			for (object in message.message){
				if (typeof (message.message[object]) === "object"){
					contentString += "<div onClick='app.showInspector(this)' class='object' object=" + escape(JSON.stringify(message.message[object])) + ">" + object + "</div>";
				} else {
					contentString += "<div class='text'><strong>" + object + "</strong>: " + message.message[object] + "</div>";
				}
			}
			contentString += "</div>";
			
			//Create a content object that will be added to the main array.
			content = {text: contentString, timestamp: new Date(), source: null}

			//Check if the project already exists
			record = data.findRecord('project', message.project, 0, false, false, true);
			if (record) {
				record.data.content.push(content);
				record.dirty = true;
				data.sync();
				if (record === currentRecord) {
					for (i=0;i<record.data.content.length;i++){
						text += record.data.content[i].text;
					}
			        page.update(text);
				}
			} else {
				//Create our array if one doesn't already exist, and add our content object.
				var record = [];
				record.push(content);
				data.add({project: message.project, content: record});
			}
			data.save();
		});
    }
});