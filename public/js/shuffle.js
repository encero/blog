(function (document){
	if (document.querySelector) {
		var items = document.querySelectorAll('.shuffle');

		for (var index = items.length - 1; index >= 0; index--) {
			var item = items[index];

			if (item.children) {
				for (var i = item.children.length; i >= 0; i--) {
				    item.appendChild(item.children[Math.random() * i | 0]);
				}
			}
		}
	}
})(document)