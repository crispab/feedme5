/* global Meteor, Deps, Template, Session, List, $, Stores, confirm */

(function() {

	"use strict";

	Meteor.startup(function() {
		Deps.autorun(Template.viewShoppingList.list);
		Session.set('filter', 'all');
	});

	Template.editShoppingList.list = function() {

		var store = Session.get("shopByStore"), sortInfo = {}, sort = {}, query = {}, selectedLetter, alphaSort = Session.get('alpha-sort');

		if (alphaSort) {
			selectedLetter = Session.get('selectedLetter');
			if (selectedLetter) {
				query = {$where: function() {
					return this.name.substr(0, 1) === selectedLetter;
				}};
			}
			sortInfo.name = 1;
			sort = {sort: sortInfo};
		} else if (store) {
			sortInfo[store] = 1;
			sort = {sort: sortInfo};
		}
		var result = List.find(query, sort);
		if (alphaSort && result.fetch().length === 0) {
			Session.set('selectedLetter', undefined);
			return;
		}
		return result;
	};

	Template.editShoppingList.filterSelected = function(filter) {
		var currentFilter = Session.get('filter');
		return currentFilter === filter;
	};

	Template.editShoppingList.canSort = function() {
		var filter = Session.get('filter');
		return !!Session.get("shopByStore") && filter === 'all';
	};

	Template.editShoppingList.events({
		'click a[data-clear="true"]': function(e) {
			List.find().forEach(function(list) {
				List.update({_id: list._id}, {$set: {included: false, checked: false, extra: ''}});
			});
			e.preventDefault();
		},
		'keypress input[name=add]': function(e, t) {
			if (e.keyCode === 13) {
				var input = t.find('input[type=text]');
				if (input.value) {
					var o = {name: input.value, owner: Meteor.userId(), included: true};
					Stores.find().forEach(function(store) {
						o[store._id] = findLowestSortOrder(store._id) - 1;
					});
					List.insert(o);
					checkFirstLetterOfInsertedItem(input.value);
					input.value = '';
				}
			}
		},
		'click input[name=list-filter]': function(e) {
			e.preventDefault();
			var value = e.toElement.value;
			Session.set('filter', value);
		}
	});

	var checkFirstLetterOfInsertedItem = function(item) {
		var letter = item.substr(0, 1);
		if (Session.get('selectedLetter')) {
			Session.set('selectedLetter', letter);
		}
	};

	var findLowestSortOrder = function(storeId) {
		var result = Number.MAX_VALUE;
		List.find().forEach(function(item) {
			if (item[storeId] < result) {
				result = item[storeId];
			}
		});
		return result;
	};

	Template.editShoppingList.rendered = function() {
		$('ul[data-sortable="true"]').sortable({stop: function(event, ui) {
			Deps.nonreactive(function() {
				var setInfo = {};
				$(ui.item).parent().find('li').each(function(index, item) {
					setInfo[Session.get("shopByStore")] = index;
					List.update({_id: $(item).attr('data-id')}, {$set: setInfo});
				});
			});
		}});
		$('ul[data-sortable="false"]:data(uiSortable)').sortable('destroy');

		$('input[name=add]').autocomplete({
			autoFocus: true,
			source: function(request, response) {
				var data = (List.find({}, {sort: {name: 1}})).fetch().map(function(item) {
					return {label: item.name, _id: item._id};
				});
				var results = $.ui.autocomplete.filter(data, request.term);
				results = results.sort(function(a, b) {
					return a.label.toLowerCase().indexOf(request.term.toLowerCase()) - b.label.toLowerCase().indexOf(request.term.toLowerCase());
				});
				response(results);
			},
			select: function(event, ui) {
				event.preventDefault();
				List.update({_id: ui.item._id}, {$set: {included: true}});
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

	Template.editShoppingItem.events({
		'click li': function(e, t) {
			if (!Session.get('edit-' + this._id) && !Session.get('edit-extra-' + this._id)) {
				List.update({_id: t.data._id}, {$set: {included: t.data.included ? false : true}});
			}
		},
		'click .name': function(e, t) {
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
		'click .extra': function(e, t) {
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
		'click .del': function(e, t) {
			if (confirm('Delete item permanently?')) {
				List.remove({_id: t.data._id});
			}
			e.preventDefault();
			e.stopPropagation();
		},
		'keypress input[name=name]': function(e, t) {
			if (e.keyCode === 13) {
				saveItemInformation(e, t);
			}
		},
		'keypress input[name=extra]': function(e, t) {
			if (e.keyCode === 13) {
				saveExtraItemInformation(e, t);
			}
		},
		'blur input[name=name]': function(e, t) {
			saveItemInformation(e, t);
		},
		'blur input[name=extra]': function(e, t) {
			saveExtraItemInformation(e, t);
		}

	});

	var saveItemInformation = function(e, t) {
		if (e.currentTarget.value) {
			List.update({_id: t.data._id}, {$set: {name: e.currentTarget.value}});
		}
		Session.set('edit-' + t.data._id, false);
	};

	var saveExtraItemInformation = function(e, t) {
		List.update({_id: t.data._id}, {$set: {extra: e.currentTarget.value}});
		Session.set('edit-extra-' + t.data._id, false);
	};

	Template.editShoppingItem.showItem = function() {
		var filter = Session.get('filter'),
			showAll = !filter || filter === 'all',
			showIncluded = filter === 'included';
		return this.included === showIncluded || showAll;
	};

	Template.editShoppingItem.editing = function() {
		return Session.get('edit-' + this._id);
	};

	Template.editShoppingItem.editingExtra = function() {
		return Session.get('edit-extra-' + this._id);
	};

	Template.editShoppingItem.hasExtra = function() {
		var list = List.findOne({_id: this._id});
		return list && !!list.extra;
	};
})();