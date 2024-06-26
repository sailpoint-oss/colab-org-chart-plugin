package sailpoint.community.plugin.orgchartplugin.rest;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import sailpoint.api.SailPointContext;
import sailpoint.community.plugin.orgchartplugin.service.PluginSettingService;
import sailpoint.object.Identity;
import sailpoint.rest.plugin.BasePluginResource;
import sailpoint.rest.plugin.RequiredRight;
import sailpoint.tools.GeneralException;
import sailpoint.tools.Util;

@Path("orgchartplugin")
@RequiredRight("orgchartpluginRight")
public class PluginSettingResource extends BasePluginResource {

	@GET
	@Path("orgchart/preference/{identityName}")
	@Produces(MediaType.APPLICATION_JSON)
	public ResponseEntity<Map<String, Object>> getPreferences(@PathParam("identityName") final String identityName)
			throws GeneralException, IOException {
		SailPointContext context = this.getContext();
		Identity identity = context.getObjectByName(Identity.class, identityName);
		Map<String, Object> preferenceMap = new HashMap<>();
		String key = "orgChartPluginGuideTourInactive";
		preferenceMap.put(key, Util.otob(identity.getPreference(key)));
		Map<String, Object> responseBody = new HashMap<String, Object>();
		responseBody.put("preference", preferenceMap);
		responseBody.put("nodeTypes", PluginSettingService.getNodeTypes(context, "en_US"));
		return ResponseEntity.status(HttpStatus.OK).body(responseBody);
	}
	
	@POST
	@Path("orgchart/preference/{identityName}")
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	public ResponseEntity<Map<String, Object>> setPreferences(@PathParam("identityName") String identityName, Map<String, Object> map) throws GeneralException {
		SailPointContext context = this.getContext();
		Identity identity = context.getObjectByName(Identity.class, identityName);
		for (String key : Util.safeIterable(map.keySet())) {
			identity.setPreference(key, map.get(key));
		}
		context.commitTransaction();
		return ResponseEntity.status(HttpStatus.OK).body(null);
	}

	@Override
	public String getPluginName() {
		return PluginSettingService.getPluginName();
	}
}
