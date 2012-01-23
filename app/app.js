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
		data = new Ext.data.Store({
		    model: Ext.regModel('', {
				fields: [
		            {name: 'id', type: 'int'},
		            {name: 'project', type: 'string'},
					{name: 'content', type: 'string'},
				],
				proxy: {
					type: 'localstorage',
					id  : 'devpipe-projects'
				}
			}),
			data: [],
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

		menuList.addListener('selectionchange', function (model, records) {
		    if (records[0]) {
				deleteButton.show();
				currentRecord = records[0];
		        viewport.setActiveItem(page, {type: 'slide', direction: 'left'});
				pageToolbar.setTitle(records[0].data.project);
		        page.update(records[0].data.content);
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
		    floating:true,
		    width: 300,
			height:400
		});
		inspector.hide();
		
		app.showInspector = function(caller){
			var object, content;
			object = JSON.parse(caller.getAttribute('object'));
			for (i in object){
				content += "<div class='inspector-text'>" + i + ": " + object[i] + "</div>";
			}
			console.log(content);
			inspector.showBy(caller);
			inspector.update(content)
		}

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
			var timestamp, record, contentString, clickFunction;
			//Build timestamp for tagging message
			timestamp =  "[" + new Date().toUTCString() + "]";
			contentString = "<div class='message'><div class='timestamp'>" + timestamp + "</div>";
			for (object in message.message){
				console.log(typeof(message.message[object]));
				if (typeof(message.message[object]) === "object"){
					contentString += "<div onClick='app.showInspector(this)' class='text' object=" + JSON.stringify(message.message[object]) + ">[Object (Needs Inspector)]</div>";
				}
				else {
					contentString += "<div class='text'>" + message.message[object] + "</div>";
				}
			}
			contentString += "</div>";

			//Check if the project already exists
			record = data.findRecord('project', message.project, 0, false, false, true);
			if (record) {
				record.data.content += contentString;
				record.dirty = true;
				data.sync();
				if (record === currentRecord) {
					page.update(record.data.content);
				}
			} else {
				data.add({project: message.project, content: contentString});
			}
			data.save();
		});
    }
});