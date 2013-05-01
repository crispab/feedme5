/*global Meteor, Session, Template, List */

(function () {
	"use strict";
	Template.editShoppingList.list = function () {
		var store = Session.get("shopByStore"), sortInfo = {}, sort = {}, query = {}, selectedLetter;

		if (Session.get('alpha-sort')) {
			selectedLetter = Session.get('selectedLetter');
			if (selectedLetter) {
				query = {$where: function() { return this.name.substr(0, 1) === selectedLetter; }};
			}
			sortInfo['name'] = 1;
			sort = {sort: sortInfo};
		} else if (store) {
			sortInfo[store] = 1;
			sort = {sort: sortInfo};
		}
		return List.find(query, sort);
	};

	Template.editShoppingList.somethingIncluded = function () {
		var result = false;
		List.find().forEach(function(list) {
			result = result || list.included;
		});
		return result;
	};

	Template.editShoppingList.storeSet = function () {
		return !!Session.get("shopByStore");
	};

	Template.editShoppingList.events({
		'keypress input[name=add]': function (e, t) {
			if (e.keyCode === 13) {
				var input = t.find('input[type=text]');
				if (input.value) {
					var o = {name: input.value, owner: Meteor.userId(), included:true};
					Stores.find().forEach(function(store) {
						o[store._id] = findLowestSortOrder(store._id) - 1;
					});
					List.insert(o);
					input.value = '';
				}
			}
		}
	});

	var findLowestSortOrder = function(storeId) {
		var result = Number.MAX_VALUE;
		List.find().forEach(function(item) {
			if (item[storeId] < result) {
				result = item[storeId];
			}
		});
		return result;
	};

	Template.editShoppingList.rendered = function () {
		$('ul[data-sortable="true"]').sortable({stop: function (event, ui) {
			Deps.nonreactive(function() {
				var setInfo = {};
				$(ui.item).parent().find('li').each(function (index, item) {
					setInfo[Session.get("shopByStore")] = index;
					List.update({_id: $(item).attr('data-id')}, {$set: setInfo});
				});
			});
		}});
		$('ul[data-sortable="false"]:data(uiSortable)').sortable('destroy');
		var input = this.find('input[name=name]');
		if (input) {
			input.focus();
		}
		var inputExtra = this.find('input[name=extra]');
		if (inputExtra) {
			inputExtra.focus();
		}
	};

	Template.editShoppingItem.events({
		'click li': function (e, t) {
			if (!Session.get('edit-' + this._id) && !Session.get('edit-extra-' + this._id)) {
				List.update({_id: t.data._id}, {$set: {included: t.data.included ? false : true}});
			}
		},
		'click .name': function (e, t) {
			if (Session.get('current-edit')) {
				Session.set('edit-' + Session.get('current-edit'), false);
			}
			Session.set('edit-' + t.data._id, true);
			Session.set('current-edit', t.data._id);
			if (Session.get('current-edit-extra')) {
				Session.set('edit-extra-' + Session.get('current-edit-extra'), false);
			}
			e.stopPropagation();
		},
		'click .extra': function (e, t) {
			if (Session.get('current-edit-extra')) {
				Session.set('edit-extra-' + Session.get('current-edit-extra'), false);
			}
			Session.set('edit-extra-' + t.data._id, true);
			Session.set('current-edit-extra', t.data._id);
			if (Session.get('current-edit')) {
				Session.set('edit-' + Session.get('current-edit'), false);
			}
			e.stopPropagation();
		},
		'click .del': function (e, t) {
			List.remove({_id: t.data._id});
			e.stopPropagation();
		},
		'keypress input[name=name]': function(e, t) {
			if (e.keyCode === 13) {
				if (e.currentTarget.value) {
					List.update({_id: t.data._id}, {$set: {name: e.currentTarget.value}});
				}
				Session.set('edit-' + t.data._id, false);
			}
		},
		'keypress input[name=extra]': function(e, t) {
			if (e.keyCode === 13) {
				List.update({_id: t.data._id}, {$set: {extra: e.currentTarget.value}});
				Session.set('edit-extra-' + t.data._id, false);
			}
		}
	});

	Template.editShoppingItem.editing = function() {
		return Session.get('edit-' + this._id);
	};

	Template.editShoppingItem.editingExtra = function() {
		return Session.get('edit-extra-' + this._id);
	};

	Template.editShoppingItem.hasExtra = function() {
		var list = List.findOne({_id:this._id});
		return list && !!list.extra;
	};

})();
