(function (g) {

	"use strict";

	g.Meteor.startup(function () {
		g.Deps.autorun(g.Template.viewShoppingList.list);
		g.Session.set('show-checked', false);
		g.Session.set('alpha-sort', true);
		g.Session.set('shopByStore', undefined);
	});

	g.Session.set("viewing", true);

	g.Template.shoppingView.viewing = g.Template.stores.viewing = function () {
		return g.Session.get("viewing");
	};

	g.Template.stores.stores = function () {
		return g.Stores.find();
	};

	g.Template.stores.alphaSort = function () {
		return g.Session.get("alpha-sort");
	};

	var setDefaultSortingForStore = function(storeId) {
		var index = 0, setInfo = {};
		g.List.find({}, {sort: {name:1}}).forEach(function(list) {
			setInfo[storeId] = index;
			g.List.update({_id: list._id}, {$set: setInfo});
			index += 1;
		});
	};

	g.Template.stores.events({
		'keypress input': function (e, t) {
			if (e.keyCode === 13) {
				var input = t.find('input');
				if (input.value) {
					var storeId = g.Stores.insert({name: input.value, owner: g.Meteor.userId()});
					input.value = '';
					setDefaultSortingForStore(storeId);
				}
			}
		},
		'click [data-alpha-sort="true"]': function (e) {
			g.Session.set('shopByStore', undefined);
			g.Session.set('alpha-sort', true);
			e.preventDefault();
		}
	});

	// TODO: This method is nearly identical to Template.editShoppingList.list. Must consolidate.
	g.Template.viewShoppingList.list = function () {
		var store = g.Session.get("shopByStore"), sortInfo = {}, sort = {}, query = {included: true}, selectedLetter;

		if (g.Session.get('alpha-sort')) {
			selectedLetter = g.Session.get('selectedLetter');
			if (selectedLetter) {
				query.$where = function() { return this.name.substr(0, 1) === selectedLetter; };
			}
			sortInfo.name = 1;
			sort = {sort: sortInfo};
		} else if (store) {
			sortInfo[store] = 1;
			sort = {sort: sortInfo};
		}
		return g.List.find(query, sort);
	};

	g.Template.viewShoppingList.toggleLabel = function() {
		var showChecked = g.Session.get('show-checked');
		return showChecked ? 'hide' : 'show';
	};

	g.Template.viewShoppingList.itemsToShopCount = function() {
		var query = {included: true, $or: [{checked: {$exists: false}}, {checked: false}]}, length;
		length = g.List.find(query).fetch().length;
		return length === 0 ? undefined : length;
	};

	g.Template.viewShoppingList.events({
		'click a[data-toggle="true"]': function (e) {
			g.Session.set('show-checked', !g.Session.get('show-checked'));
			e.preventDefault();
		}
	});

	g.Template.viewShoppingItem.showChecked = function() {
		var showChecked = g.Session.get('show-checked');
		return !this.checked || showChecked;
	};

	g.Template.shoppingView.events({
		'click a[data-editMode="true"]': function (e) {
			g.Session.set("viewing", !g.Session.get("viewing"));
			e.preventDefault();
		}
	});

	g.Template.viewShoppingItem.events({
		'click .name': function (e, t) {
			g.List.update({_id: t.data._id}, {$set: {checked: t.data.checked ? false : true}});
		}
	});

	g.Template.shopByStore.events({
		'click .store-name': function (e, t) {
			g.Session.set("alpha-sort", false);
			g.Session.set("shopByStore", t.data._id);
		},
		'click .del': function (e, t) {
			var id = t.data._id;
			g.Stores.remove({_id: id});
			g.List.find().forEach(function(list) {
				var unsetInfo = {};
				unsetInfo[id] = '';
				g.List.update({_id: list._id}, {$unset: unsetInfo});
			});
		}
	});

	g.Template.shopByStore.selected = function() {
		var id = g.Session.get('shopByStore');
		return id === this._id;
	};

	g.Template.showLettersView.letters = function() {
		var result = {letters:[{letter:'all', selected: !g.Session.get('selectedLetter')}]};
		g.List.find({}, {sort: {name:1}}).forEach(function(item) {
			var letter = item.name.substr(0, 1);
			if (!result[letter]) {
				result[letter] = true;
				result.letters.push({letter:letter, selected: g.Session.get('selectedLetter') === letter});
			}
		});
		return result.letters;
	};

	g.Template.showLetter.events({
		'click .letter': function (e, t) {
			g.Session.set('selectedLetter', t.data.letter === 'all' ? undefined : t.data.letter);
			e.preventDefault();
		}
	});

})(this);