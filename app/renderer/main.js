		window.onload = function getURL () {

		var shell = require('electron').shell;
		var JsonDB = require('node-json-db');
		var db = new JsonDB("domain", true, true);
		var data = db.getData("/");

		if (data["domain"] !== undefined) {
			window.location.href = data["domain"];
		}
		else {
			var dialogs = require('dialogs')()
  			dialogs.prompt('Add your Zulip Domain', function (ok) {
  			db.push("/domain", ok);
  			console.log(db);
        	window.location.href = ok;
      		})
		}
}