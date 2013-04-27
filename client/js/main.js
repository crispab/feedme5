/*global Session, Template */

(function () {
	"use strict";

	Session.set("mode", "shoppingList");

	Template.shoppingList.userLoggedIn = function () {
		return !!Meteor.userId();
	};
	Template.shoppingList.adminMode = function () {
		return Session.get("mode") === "admin";
	};
	Template.shoppingList.events({
		'click #admin': function (e, t) {
			Session.set("mode", "admin");
			e.preventDefault();
		},
		'click #shoppingList': function (e, t) {
			Session.set("mode", "shoppingList");
			e.preventDefault();
		}
	});
}());