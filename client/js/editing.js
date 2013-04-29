/*global Meteor, Session, Template, List */

(function () {
	"use strict";
	Template.editShoppingList.list = function () {
		var store = Session.get("shopByStore"), sortInfo = {}, sort = {};
		if (store) {
			sortInfo[store] = 1;
			sort = {sort: sortInfo};
		}
		return List.find({}, sort);
	};

	Template.editShoppingList.storeSet = function () {
		return !!Session.get("shopByStore");
	};

	Template.editShoppingList.events({
		'keypress input': function (e, t) {
			if (e.keyCode === 13) {
				var input = t.find('input[type=text]');
				var o = {name: input.value, owner: Meteor.userId()};
				Stores.find().forEach(function(store) {
					o[store._id] = -1;
				});
				List.insert(o);
				input.value = '';
			}
		}
	});

	Template.editShoppingList.rendered = function () {
		$('ul[data-sortable="true"]').sortable({stop: function (event, ui) {
			var setInfo = {};
			$(ui.item).parent().find('li').each(function (index, item) {
				setInfo[Session.get("shopByStore")] = index;
				List.update({_id: $(item).attr('data-id')}, {$set: setInfo});
			});
		}});
	};


	Template.editShoppingItem.events({
		'click input[type=checkbox], click .name': function (e, t) {
			List.update({_id: t.data._id}, {$set: {included: t.data.included ? false : true}});
		},
		'click .del': function (e, t) {
			List.remove({_id: t.data._id});
		}
	});
}());
