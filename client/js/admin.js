/*global Session, Template, List */

(function () {
	"use strict";
	Template.dbView.list = function () {
		return List.find();
	};
	Template.dbView.events({
		'keypress input': function (e, t) {
			if (e.keyCode === 13) {
				var input = t.find('input');
				List.insert({name: input.value, owner: Meteor.userId()});
				input.value = '';
			}
		}
	});
	Template.dbItem.events({
		'click .del': function (e, t) {
			List.remove({_id: t.data._id});
		}
	});

	Session.set("adminMode", "db");
	Template.adminView.adminDbMode = function () {
		return Session.get("adminMode") === "db";
	};
	Template.adminView.events({
		'click #adminDb': function (e, t) {
			Session.set("adminMode", "db");
			e.preventDefault();
		},
		'click #adminStores': function (e, t) {
			Session.set("adminMode", "stores");
			e.preventDefault();
		}
	});

	Template.storeView.stores = Template.shoppingView.stores = function () {
		return Stores.find();
	};

	Template.storeView.storeName = function() {
		return Session.get("storeName");
	};

	var setDefaultSortingForStore = function(storeId) {
		var index = 0, setInfo = {};
		List.find({}, {sort: {name:1}}).forEach(function(list) {
			setInfo[storeId] = index;
			List.update({_id: list._id}, {$set: setInfo});
			index += 1;
		});
	};

	Template.storeView.events({
		'keypress input': function (e, t) {
			if (e.keyCode === 13) {
				var input = t.find('input');
				var storeId = Stores.insert({name: input.value, owner: Meteor.userId()});
				input.value = '';
				setDefaultSortingForStore(storeId);
			}
		}
	});

	Template.storeList.events({
		'click .name': function (e, t) {
			Session.set("store", t.data._id);
			Session.set("storeName", t.data.name);
		},
		'click .del': function (e, t) {
			var id = t.data._id;
			Stores.remove({_id: id});
			List.find().forEach(function(list) {
				var unsetInfo = {};
				unsetInfo[id] = '';
				List.update({_id: list._id}, {$unset: unsetInfo});
			});
		}
	});

	Template.storeList.selected = function() {
		var id = Session.get('store');
		return id === this._id;
	};

	Template.storeView.rendered = function () {
		$('ul[data-sortable="true"]').sortable({stop: function (event, ui) {
			var setInfo = {};
			$(ui.item).parent().find('li').each(function (index, item) {
				setInfo[Session.get("store")] = index;
				List.update({_id: $(item).attr('data-id')}, {$set: setInfo});
			});
		}});
	};

	Template.storeView.storeSet = function () {
		return !!Session.get("store");
	};

	Template.storeView.list = function () {
		var store = Session.get("store"), sortInfo = {};
		if( store ) {
			sortInfo[store] = 1;
			return List.find({}, {sort: sortInfo});
		}
	};
}());