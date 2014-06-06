/*
 * Copyright 2012 Blackberry Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*=================================================================================
 * This javascript takes care of handling the behaviour and events handling
 * of the Contact List screen.
 *=================================================================================*/

app.contactList = function() {'use strict';
	var pub = {};

	// need to know when this screen is displayed
	var displayed = false;

	// multi select mode
	var multi_mode = false;
	var multi_items = [];

	pub.onDomReady = function() {
		console.log('contactList.onDomReady()');
		pub.populateContactList();

		// Update the action bar for contactlist with the bbid (if available)
		if (blackberry.identity) { 
			document.getElementById('phoneinfo').innerHTML = '<b>PIN:</b> '+(blackberry.identity.uuid).substr(2).toUpperCase();
		};
	};

	pub.onScreenReady = function() {
		console.log('contactList.onScreenReady()');
		displayed = true;
	};

	pub.onOtherScreenReady = function() {
		displayed = false;
	};

	pub.onListUpdate = function() {
		if (displayed) {
			app.contactList.populateContactList();
		}
	};

	pub.enableMultiSelect = function() {
		var button = document.getElementById('multiselectButton');
		multi_mode = true;
		button.setCaption("Cancel");
		button.onclick = pub.disableMultiSelect;
		button.setImage('img/actionbar/select_cancel.png');

		//show pin blast function
		document.getElementById('actionMultiPIN').show();

		//hide all other actions
		document.getElementById('actionSearch').hide();
		document.getElementById('actionAbout').hide();
		document.getElementById('actionRefresh').hide();
		document.getElementById('actionTools').hide();
		document.getElementById('actionPhone').hide();

		document.getElementById('contextCall').hide();
		document.getElementById('contextEmail').hide();
		document.getElementById('contextSMS').hide();
		document.getElementById('contextPIN').hide();
	}

	pub.disableMultiSelect = function() {
		var button = document.getElementById('multiselectButton');
		multi_mode = false;
		button.setCaption("Select Multiple");
		button.onclick = pub.enableMultiSelect;
		button.setImage('img/actionbar/select_more.png');

		for (var i = 0; i < multi_items.length; i++) {
			var item = multi_items[i];
			item.classList.remove('bb-bb10-image-list-item-hover');
			item.classList.remove('bb10Highlight');
		}
		multi_items.length = 0;

		//hide pin blast function
		document.getElementById('actionMultiPIN').hide();

		//show all other actions
		document.getElementById('actionSearch').show();
		document.getElementById('actionAbout').show();
		document.getElementById('actionRefresh').show();
		document.getElementById('actionTools').show();
		document.getElementById('actionPhone').show();

		document.getElementById('contextCall').show();
		document.getElementById('contextEmail').show();
		document.getElementById('contextSMS').show();
		document.getElementById('contextPIN').show();
	}

	pub.onActionMultiPIN = function() {
		if (multi_items.length > 0) {
			var pinList = [];

			for (var i = 0; i < multi_items.length; i++) {
				var item = multi_items[i];
				var contact = app.model.findContactByName(item.getAttribute('data-bb-title'));
				pinList.push(contact.bbPin);
			}

			app.utils.pinMessageMultiple(pinList);
			pub.disableMultiSelect();
		}
	}

	/*=================================================================================
	 * Show the demo screen with dummy data.
	 *=================================================================================*/
	pub.openDemoList = function() {
		var r = confirm("If you continue, the current \ncontact list will be overwritten\n with sample data!");
		if (r == true) {
			app.model.setDemoList();
			bb.pushScreen('contactlist.htm', 'contactList');
		}
	};

	/*=================================================================================
	 * Populate the main Contact List from the data model.
	 *=================================================================================*/
	pub.populateContactList = function() {
		console.log('contactList.populateContactList()');
		var listDivElement = document.getElementById('listContent');
		var items = [];
		var item, i, j;
		var eclList = app.model.getList();

		if (!eclList) return;
		
		if (eclList.length==1 && eclList[0].list=='') {
			console.log('Empty data set retrieved');
			listDivElement.style.display = "block";
			return;
		}
		// contacts grouped by team
		for ( i = 0; i < eclList.length; i++) {
			var team = eclList[i];

			// team header
			item = pub.createHeader(team.title);
			items.push(item);

			// team contacts
			for ( j = 0; j < team.list.length; j++) {
				var person = team.list[j];

				item = pub.createItem(person.name, person.title);
				items.push(item);
			}
		}
		listDivElement.refresh(items);
		listDivElement.style.display = "block";
	};

	/*=================================================================================
	 * Create the Header for each team in the Contact list.
	 *=================================================================================*/
	pub.createHeader = function(headerText) {
		console.log('contactlist.createHeader()');
		var item = document.createElement('div');
		item.setAttribute('data-bb-type', 'header');
		// Display as bbui.js
		item.innerHTML = headerText;
		return item;
	};

	/*=================================================================================
	 * Create the "Contact" Item for the Contact list.
	 *=================================================================================*/
	pub.createItem = function(title, subTitle) {
		console.log('contactlist.createItem()');
		var item = document.createElement('div');
		item.setAttribute('data-bb-type', 'item');
		// Display as bbui.js
		item.setAttribute('data-bb-title', title);
		
		item.onclick = function() {
			if (multi_mode) {
				var index = multi_items.indexOf(item);
				if (index == -1) {
					multi_items.push(item);
				}
				else {
					multi_items.splice(index, 1);
				}

				item.classList.toggle('bb-bb10-image-list-item-hover');
				item.classList.toggle('bb10Highlight');

			}
			else {
				app.contactList.showDetails(title);
			}
		}

		if (subTitle) {
			item.innerHTML = subTitle;
		}
		return item;
	};

	/*=================================================================================
	 * Show details  of the contact based on the contact name.
	 *=================================================================================*/
	pub.showDetails = function(contactName) {
		console.log('contactlist.showDetails()');
		var contact = app.model.findContactByName(contactName);
		app.details.setContact(contact);
		bb.pushScreen('details.htm', 'details');
	};

	/*=================================================================================
	 * 'Call' the contact via the Context menu.
	 *=================================================================================*/
	pub.doContextMenuCall = function() {
		console.log('contactlist.doContextMenuCall()');
		var context = document.getElementById('contactActions');
		// context.menu.selected is the DOM element that was selected in the press-and-hold
		var selectedItem = context.menu.selected;

		if (selectedItem) {
			console.log(selectedItem);
			console.log("Call " + selectedItem.title);

			// title is contact name
			app.utils.callByName(selectedItem.title);
		} else {
			console.log("couldn't get selected item");
		}
	};

	/*=================================================================================
	 * Send an email to the contact via the Context menu.
	 *=================================================================================*/
	pub.doContextMenuEmail = function() {
		console.log('contactlist.doContextMenuEmail()');
		var context = document.getElementById('contactActions');
		// context.menu.selected is the DOM element that was selected in the press-and-hold
		var selectedItem = context.menu.selected;

		if (selectedItem) {
			console.log("Email " + selectedItem.title);

			// title is contact name
			app.utils.emailByName(selectedItem.title);
		} else {
			console.log("couldn't get selected item");
		}
	};

	/*=================================================================================
	 * 'PIN' the contact via the Context menu.
	 *=================================================================================*/
	pub.doContextMenuPIN = function() {
		console.log('contactlist.doContextMenuPIN()');
		var context = document.getElementById('contactActions');
		// context.menu.selected is the DOM element that was selected in the press-and-hold
		var selectedItem = context.menu.selected;

		if (selectedItem) {
			console.log("PIN message " + selectedItem.title);

			// title is contact name
			app.utils.pinByName(selectedItem.title);
		} else {
			console.log("couldn't get selected item");
		}
	};

	/*=================================================================================
	 * Show the search input box.
	 *=================================================================================*/
	pub.showSearchField = function() {
		console.log('contactlist.showSearchField()');
		var inputBlock = document.getElementById("searchDiv");
		var inputField = document.getElementById("searchEdit");

		console.log('showSearchField: ' + inputField.value);
		inputField.value = "";
		console.log('value after clear: ' + inputField.value);
		inputBlock.style.display = "block";
		inputField.focus();
	};

	/*=================================================================================
	 * Hide the search input box.
	 *=================================================================================*/
	pub.hideSearchField = function() {
		console.log('contactlist.hideSearchField()');
		var inputBlock = document.getElementById("searchDiv");
		var inputField = document.getElementById("searchEdit");

		console.log("clear field: " + inputField.value);
		if (inputField.value == "") {
			console.log("Hide search bar.");
			inputBlock.style.display = "none";
			pub.populateContactList();
		}
	};

	/*=================================================================================
	 * Update the contact-list screen with contacts corresponding to the
	 * text that is entered into the search input box by the user.
	 *=================================================================================*/
	pub.updateSearchList = function(event) {
		console.log('contactlist.updateSearchList()');
		var i;
		var j;
		var listDivElement = document.getElementById('listContent');
		var searchStr = event.target.value;
		var items = [];
		var item;
		var eclList = app.model.getList();
		var pattern = RegExp(searchStr, 'i');

		// contacts grouped by team
		for ( i = 0; i < eclList.length; i++) {
			var team = eclList[i];
			var addedTeamHeader = false;

			// team contacts
			for ( j = 0; j < team.list.length; j++) {
				var person = team.list[j];

				if (person.name.search(pattern) >= 0) {
					if (!addedTeamHeader) {
						// include team header
						item = pub.createHeader(team.title);
						items.push(item);
						addedTeamHeader = true;
					}

					item = pub.createItem(person.name, person.title);
					items.push(item);
				}
			}
		}

		if (items.length > 0) {
			console.log(items.length + " items in list.");
			listDivElement.style.display = "block";
			listDivElement.refresh(items);
		} else {
			console.log("No items in list.");
			listDivElement.style.display = "none";
		}
	};

	return pub;
}();
