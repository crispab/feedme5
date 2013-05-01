/*global Meteor, Session, Template, List */

(function () {
	"use strict";
	Meteor.startup(function () {
		Deps.autorun(Template.shoppingView.list);
		Session.set('show-checked', true);
		Session.set('alpha-sort', true);
		Session.set('shopByStore', undefined);
	});

	Session.set("viewing", true);

	Template.shoppingView.viewing = Template.stores.viewing = function () {
		return Session.get("viewing");
	};

	// TODO: This method is nearly identical to Template.editShoppingList.list. Must consolidate.
	Template.shoppingView.list = function () {
		var store = Session.get("shopByStore"), sortInfo = {}, sort = {}, query = {included: true}, selectedLetter;

		if (Session.get('alpha-sort')) {
			selectedLetter = Session.get('selectedLetter');
			if (selectedLetter) {
				query.$where = function() { return this.name.substr(0, 1) === selectedLetter; };
			}
			sortInfo['name'] = 1;
			sort = {sort: sortInfo};
		} else if (store) {
			sortInfo[store] = 1;
			sort = {sort: sortInfo};
		}
		return List.find(query, sort);
	};

	Template.stores.stores = function () {
		return Stores.find();
	};

	Template.stores.alphaSort = function () {
		return Session.get("alpha-sort");
	};

	var setDefaultSortingForStore = function(storeId) {
		var index = 0, setInfo = {};
		List.find({}, {sort: {name:1}}).forEach(function(list) {
			setInfo[storeId] = index;
			List.update({_id: list._id}, {$set: setInfo});
			index += 1;
		});
	};

	Template.stores.events({
		'keypress input': function (e, t) {
			if (e.keyCode === 13) {
				var input = t.find('input');
				if (input.value) {
					var storeId = Stores.insert({name: input.value, owner: Meteor.userId()});
					input.value = '';
					setDefaultSortingForStore(storeId);
				}
			}
		},
		'click [data-alpha-sort="true"]': function (e, t) {
			Session.set('shopByStore', undefined);
			Session.set('alpha-sort', true);
			e.preventDefault();
		}
	});

	Template.shoppingView.toggleLabel = function() {
		var showChecked = Session.get('show-checked');
		return showChecked ? 'hide' : 'show';
	};

	Template.viewShoppingItem.showChecked = function() {
		var showChecked = Session.get('show-checked');
		return !this.checked || showChecked;
	};

	Template.shoppingView.events({
		'click a[data-clear="true"]': function (e, t) {
			List.find().forEach(function(list) {
				List.update({_id: list._id}, {$set: {checked: false, extra: ''}});
			});
			e.preventDefault();
		},
		'click a[data-toggle="true"]': function (e, t) {
			Session.set('show-checked', !Session.get('show-checked'));
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

	Template.shopByStore.events({
		'click .name': function (e, t) {
			Session.set("alpha-sort", false);
			Session.set("shopByStore", t.data._id);
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

	Template.shopByStore.selected = function() {
		var id = Session.get('shopByStore');
		return id === this._id;
	};

	Template.showLettersView.letters = function() {
		var result = {letters:[{letter:'all', selected: !Session.get('selectedLetter')}]};
		List.find({}, {sort: {name:1}}).forEach(function(item) {
			var letter = item.name.substr(0, 1);
			if (!result[letter]) {
				result[letter] = true;
				result.letters.push({letter:letter, selected: Session.get('selectedLetter') === letter});
			}
		});
		return result.letters;
	};

	Template.showLetter.events({
		'click .letter': function (e, t) {
			Session.set('selectedLetter', t.data.letter === 'all' ? undefined : t.data.letter);
			e.preventDefault();
		}
	});

}());