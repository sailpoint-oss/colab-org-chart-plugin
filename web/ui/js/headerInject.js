jQuery(document).ready(function() {

	var orgChartPluginUrl = SailPoint.CONTEXT_PATH + '/plugins/pluginPage.jsf?pn=orgchartplugin';
	var check = jQuery("a[href$='/manage/riskScores/appRiskScores.jsf']");

	// Disable logging for production
	// console.log = function() {}

	if (check.length > 0) {

		jQuery("a[href$='/manage/riskScores/appRiskScores.jsf']").parent().after(
			'<li role="presentation" aria-hidden="true" class="divider"></li>' +
	    	'<li role="presentation"><a href="'+ orgChartPluginUrl +'" role="menuitem" class="menuitem" tabindex="0">Organizational Chart</a></li>'
		);

	} else {

		jQuery("a[href$='/analyze/reports/viewReports.jsf?resetTab=true&forceLoad=true']").parent().after(
			'<li role="presentation" aria-hidden="true" class="divider"></li>' +
	    	'<li role="presentation"><a href="'+ orgChartPluginUrl +'" role="menuitem" class="menuitem" tabindex="0">Organizational Chart</a></li>'
		);

	}

	/*if (location.pathname.endsWith('define/identity/identity.jsf')) {
		let text = jQuery("#bodyDivTitle").text();
		const params = new URLSearchParams(window.location.search);
		let updatedInnerHtml = text + '<a href="'+ orgChartPluginUrl + '&id=' + params.get('id') + '" title="Organizational Chart">🔗</a>';
		jQuery("#bodyDivTitle").html(updatedInnerHtml);
	}

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
	}*/
});
