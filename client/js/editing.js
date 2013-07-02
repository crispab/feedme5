(function (g) {

	"use strict";

	var $ = g.jQuery;

	g.Meteor.startup(function () {
		g.Deps.autorun(g.Template.viewShoppingList.list);
		g.Session.set('filter', 'all');
	});

	g.Template.editShoppingList.list = function () {
		var store = g.Session.get("shopByStore"), sortInfo = {}, sort = {}, query = {}, selectedLetter, alphaSort = g.Session.get('alpha-sort');

		if (alphaSort) {
			selectedLetter = g.Session.get('selectedLetter');
			if (selectedLetter) {
				query = {$where: function() { return this.name.substr(0, 1) === selectedLetter; }};
			}
			sortInfo.name = 1;
			sort = {sort: sortInfo};
		} else if (store) {
			sortInfo[store] = 1;
			sort = {sort: sortInfo};
		}
		var result = g.List.find(query, sort);
		if (alphaSort && result.fetch().length === 0) {
			g.Session.set('selectedLetter', undefined);
			return;
		}
		return result;
	};

	g.Template.editShoppingList.filterSelected = function(filter) {
		var currentFilter = g.Session.get('filter');
		return currentFilter === filter;
	};

	g.Template.editShoppingList.canSort = function () {
		var filter = g.Session.get('filter');
		return !!g.Session.get("shopByStore") && filter === 'all';
	};

	g.Template.editShoppingList.events({
		'click a[data-clear="true"]': function (e) {
			g.List.find().forEach(function(list) {
				g.List.update({_id: list._id}, {$set: {included: false, checked: false, extra: ''}});
			});
			e.preventDefault();
		},
		'keypress input[name=add]': function (e, t) {
			if (e.keyCode === 13) {
				var input = t.find('input[type=text]');
				if (input.value) {
					var o = {name: input.value, owner: g.Meteor.userId(), included:true};
					g.Stores.find().forEach(function(store) {
						o[store._id] = findLowestSortOrder(store._id) - 1;
					});
					g.List.insert(o);
					checkFirstLetterOfInsertedItem(input.value);
					input.value = '';
				}
			}
		},
		'click input[name=list-filter]': function (e,t) {
			e.preventDefault();
			var value = e.toElement.value;
			g.Session.set('filter', value);
		}
	});

	var checkFirstLetterOfInsertedItem = function(item) {
		var letter = item.substr(0, 1);
		if (g.Session.get('selectedLetter')) {
			g.Session.set('selectedLetter', letter);
		}
	};

	var findLowestSortOrder = function(storeId) {
		var result = Number.MAX_VALUE;
		g.List.find().forEach(function(item) {
			if (item[storeId] < result) {
				result = item[storeId];
			}
		});
		return result;
	};

	g.Template.editShoppingList.rendered = function () {
		$('ul[data-sortable="true"]').sortable({stop: function (event, ui) {
			g.Deps.nonreactive(function() {
				var setInfo = {};
				$(ui.item).parent().find('li').each(function (index, item) {
					setInfo[g.Session.get("shopByStore")] = index;
					g.List.update({_id: $(item).attr('data-id')}, {$set: setInfo});
				});
			});
		}});
		$('ul[data-sortable="false"]:data(uiSortable)').sortable('destroy');

		$('input[name=add]').autocomplete({
			autoFocus: true,
			source: g.List.find().fetch().map(function(item) {
				return {label: item.name, _id:item._id};
			}),
			select: function(event, ui) {
				event.preventDefault();
				g.List.update({_id: ui.item._id}, {$set: {included: true}});
				this.value = '';
				this.focus();
			}
		});

		var input = this.find('input[name=name]');
		if (input) {
			input.focus();
		}
		var inputExtra = this.find('input[name=extra]');
		if (inputExtra) {
			inputExtra.focus();
		}
	};

	g.Template.editShoppingItem.events({
		'click li': function (e, t) {
			if (!g.Session.get('edit-' + this._id) && !g.Session.get('edit-extra-' + this._id)) {
				g.List.update({_id: t.data._id}, {$set: {included: t.data.included ? false : true}});
			}
		},
		'click .name': function (e, t) {
			if (g.Session.get('current-edit')) {
				g.Session.set('edit-' + g.Session.get('current-edit'), false);
			}
			g.Session.set('edit-' + t.data._id, true);
			g.Session.set('current-edit', t.data._id);
			if (g.Session.get('current-edit-extra')) {
				g.Session.set('edit-extra-' + g.Session.get('current-edit-extra'), false);
			}
			e.stopPropagation();
		},
		'click .extra': function (e, t) {
			if (g.Session.get('current-edit-extra')) {
				g.Session.set('edit-extra-' + g.Session.get('current-edit-extra'), false);
			}
			g.Session.set('edit-extra-' + t.data._id, true);
			g.Session.set('current-edit-extra', t.data._id);
			if (g.Session.get('current-edit')) {
				g.Session.set('edit-' + g.Session.get('current-edit'), false);
			}
			e.stopPropagation();
		},
		'click .del': function (e, t) {
			g.List.remove({_id: t.data._id});
			e.stopPropagation();
		},
		'keypress input[name=name]': function(e, t) {
			if (e.keyCode === 13) {
				if (e.currentTarget.value) {
					g.List.update({_id: t.data._id}, {$set: {name: e.currentTarget.value}});
				}
				g.Session.set('edit-' + t.data._id, false);
			}
		},
		'keypress input[name=extra]': function(e, t) {
			if (e.keyCode === 13) {
				g.List.update({_id: t.data._id}, {$set: {extra: e.currentTarget.value}});
				g.Session.set('edit-extra-' + t.data._id, false);
			}
		}
	});

	g.Template.editShoppingItem.showItem = function() {
		var filter = g.Session.get('filter'), 
			showAll = !filter || filter === 'all', 
			showIncluded = filter === 'included';
		return this.included === showIncluded || showAll;
	};

	g.Template.editShoppingItem.editing = function() {
		return g.Session.get('edit-' + this._id);
	};

	g.Template.editShoppingItem.editingExtra = function() {
		return g.Session.get('edit-extra-' + this._id);
	};

	g.Template.editShoppingItem.hasExtra = function() {
		var list = g.List.findOne({_id:this._id});
		return list && !!list.extra;
	};

})(this);
