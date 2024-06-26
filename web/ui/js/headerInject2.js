jQuery(document).ready(function() {

	var orgChartPluginUrl = SailPoint.CONTEXT_PATH + '/plugins/pluginPage.jsf?pn=orgchartplugin';

	if (location.pathname.endsWith('define/identity/identity.jsf')) {
		let text = jQuery("#bodyDivTitle").text();
		const params = new URLSearchParams(window.location.search);
		let updatedInnerHtml = text + '<a href="'+ orgChartPluginUrl + '&id=' + params.get('id') + '" title="Organizational Chart">🔗</a>';
		jQuery("#bodyDivTitle").html(updatedInnerHtml);
	}

});
