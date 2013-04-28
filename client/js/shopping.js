/*global Meteor, Session, Template, List */

(function () {
	"use strict";
	Meteor.startup(function () {
		Deps.autorun(Template.shoppingView.list);
	});

	Session.set("viewing", true);

	Template.shoppingView.viewing = function () {
		return Session.get("viewing");
	};

	Template.shoppingView.list = function () {
		var store = Session.get("shopByStore"), sortInfo = {}, sort = {};
		if (store) {
			sortInfo[store] = 1;
			sort = {sort: sortInfo};
		}
		return List.find({included: true}, sort);
	};

	Template.shoppingView.somethingIncluded = function () {
		var result = false;
		List.find().forEach(function(list) {
			result = result || list.included;
		});
		return result;
	};

	Template.shoppingView.events({
		'click a[data-clear="true"]': function (e, t) {
			List.find().forEach(function(list) {
				List.update({_id: list._id}, {$set: {checked: false}});
			});
			e.preventDefault();
		},
		'click a[data-editMode="true"]': function (e, t) {
			Session.set("viewing", !Session.get("viewing"));
			e.preventDefault();
		},
		'click input[name="check-all"]': function (e, t) {
			var currentState = e.currentTarget.checked;
			List.find().forEach(function(list) {
				List.update({_id: list._id}, {$set: {included: !!currentState}});
			});
		}
	});

	Template.viewShoppingItem.events({
		'click .name': function (e, t) {
			List.update({_id: t.data._id}, {$set: {checked: t.data.checked ? false : true}});
		}
	});

	Template.shoppingView.editList = function () {
		var store = Session.get("shopByStore"), sortInfo = {}, sort = {};
		if (store) {
			sortInfo[store] = 1;
			sort = {sort: sortInfo};
		}
		return List.find({}, sort);
	};

	Template.editShoppingItem.events({
		'click input[type=checkbox], click .name': function (e, t) {
			List.update({_id: t.data._id}, {$set: {included: t.data.included ? false : true}});
		}
	});

	Template.shopByStore.events({
		'click .name': function (e, t) {
			Session.set("shopByStore", t.data._id);
		}
	});

	Template.shopByStore.selected = function() {
		var id = Session.get('shopByStore');
		return id === this._id;
	};

}());