/*global Session, Template */

(function () {
	"use strict";

	Template.shoppingList.userLoggedIn = function () {
		return !!Meteor.userId();
	};
}());