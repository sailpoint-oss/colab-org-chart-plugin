jQuery(document).ready(function() {

	var orgChartPluginUrl = SailPoint.CONTEXT_PATH + '/plugins/pluginPage.jsf?pn=orgchartplugin';

	// Disable logging for production
	console.log = function() {}

	if (location.href.includes('identities/identities.jsf#')) {
		const targetNode = document.getElementById('identity-name');
		console.log(targetNode);
		const config = { 
			attributes: true,
			attributeFilter: ['aria-hidden'], 
			childList: false, 
			subtree: true,
			characterData: false
		};
		// Create an observer instance linked to the callback function
		// Callback function to execute when mutations are observed
		const observer = new MutationObserver(function(mutations_list, observer) {
			mutations_list.forEach(function(mutation) {
				if (location.hash.split('/')[1] === 'quickLinks' && location.hash.endsWith('identities')) {
					//console.log(mutation);
					console.log("Identity Selection Cards page");
				} else if (location.href.includes('identities/identities.jsf#/identities')) {
					console.log(mutation);
					let text = jQuery('#identity-name').text();
					if (text) {
						if (location.hash.split('/').length >= 3 && !text.endsWith('🔗')) {
							let updatedInnerHtml = text + '<a href="'+ orgChartPluginUrl + '&id=' + location.hash.split('/')[2] + '" title="Organizational Chart">🔗</a>';
							jQuery("#identity-name").html(updatedInnerHtml);
							console.log(jQuery("#identity-name").html());
							// If disconnect, the back-forward on Identities Selection and detail page wont work.
							// console.log("Diconnect MutationObserver");
							// observer.disconnect();
						}
					} else {
						console.log("Org Chart Plugin: can not find #identity-name");
					}
				}
			});
		});

		// Start observing the target node for configured mutations
		console.log("Start MutationObserver Observing");
		observer.observe(document, config);
	}
});
