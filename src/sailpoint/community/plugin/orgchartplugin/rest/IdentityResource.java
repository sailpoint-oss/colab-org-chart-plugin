package sailpoint.community.plugin.orgchartplugin.rest;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import sailpoint.api.SailPointContext;
import sailpoint.community.plugin.orgchartplugin.service.IdentityService;
import sailpoint.community.plugin.orgchartplugin.service.PluginSettingService;
import sailpoint.object.Identity;
import sailpoint.object.Rule;
import sailpoint.rest.plugin.BasePluginResource;
import sailpoint.rest.plugin.RequiredRight;
import sailpoint.tools.GeneralException;
import sailpoint.tools.Util;

@Path("orgchartplugin")
@RequiredRight("orgchartpluginRight")
public class IdentityResource extends BasePluginResource {

	@GET
	@Path("orgchart/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public ResponseEntity<Map<String, Object>> getOrgChart(@PathParam("id") final String id) {
		SailPointContext context = this.getContext();
		HttpStatus responseStatus = HttpStatus.OK;
		String message = null;
		List<Map<String, Object>> nodes = null;
		try {
			nodes = IdentityService.getTreeNodes(context, id);
		} catch (GeneralException e) {
			responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
			message = e.getMessage();
			
		}
		Map<String, Object> responseBody = new HashMap<String, Object>();
		responseBody.put("nodes", nodes);
		responseBody.put("message", message);
		return ResponseEntity.status(responseStatus).body(responseBody);
	}
	
	@SuppressWarnings("unchecked")
	@POST
	@Path("orgchart/connections")
	@Produces(MediaType.APPLICATION_JSON)
	public ResponseEntity<Map<String, Object>> getConnections(Map<String, Object> payload) {
		SailPointContext context = this.getContext();
		List<Map<String, Object>> connections = new ArrayList<>();
		HttpStatus responseStatus = HttpStatus.OK;
		String message = null;
		String ruleName = PluginSettingService.getSettingConnectionRule();
		try {
			if (Util.isNotNullOrEmpty(ruleName)) {
				if (payload.containsKey("allNodeIds")) {
					Rule rule = context.getObjectByName(Rule.class, ruleName);
					if (rule != null) {
						connections = (List<Map<String, Object>>) context.runRule(rule, payload);
					} else {
						responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
						message = "Can not retrieve Connection Rule object: " + ruleName;
					}
				} else {
					responseStatus = HttpStatus.BAD_REQUEST;
					message = "allNodeIds is missing";
				}
			} else {
				message = "No rule Connection Rule defined";
			}
		} catch (GeneralException e) {
			responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
			message = e.getMessage();
		}
		Map<String, Object> responseBody = new HashMap<String, Object>();
		responseBody.put("connections", connections);
		responseBody.put("message", message);
		return ResponseEntity.status(responseStatus).body(responseBody);
	}
	
	@GET
	@Path("orgchart/manages/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public ResponseEntity<Map<String, Object>> getManages(@PathParam("id") final String id) {
		SailPointContext context = this.getContext();
		HttpStatus responseStatus = HttpStatus.OK;
		String message = null;
		List<Map<String, Object>> nodes = new ArrayList<>();
		try {
			List<String> childs = IdentityService.getChilds(context, id);
			for (String _id : Util.safeIterable(childs)) {
				Identity node = context.getObjectById(Identity.class, _id);
				nodes.add(IdentityService.getNodeMap(context, node, null));
			}
		} catch (GeneralException e) {
			responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
			message = e.getMessage();
		}
		Map<String, Object> responseBody = new HashMap<String, Object>();
		responseBody.put("nodes", nodes);
		responseBody.put("message", message);
		return ResponseEntity.status(responseStatus).body(responseBody);
	}
	
	@GET
	@Path("orgchart/details/{type}/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	public ResponseEntity<Map<String, Object>> getDetails(@PathParam("id") final String id, @PathParam("type") final String type) {
		SailPointContext context = this.getContext();
		HttpStatus responseStatus = HttpStatus.OK;
		String message = null;
		Map<String, Object> details = new HashMap<>();
		try {
			Identity identity = context.getObjectById(Identity.class, id);
			if (identity != null) {
				if (identity.isWorkgroup()) {
					details.put("members", IdentityService.getMembers(context, identity, "displayName"));
				} else {
					details.put("attributes", IdentityService.getIdentityDetailAttributes(context, identity));
					details.put("roleAssignments", IdentityService.getActiveRoleAssignments(context, identity));
					details.put("policyViolations", IdentityService.getPolicyViolations(context, identity));
					List<Identity> workgroups = identity.getWorkgroups();
					List<String> workgroupNames= new ArrayList<>();
					if (Util.nullSafeSize(workgroups) > 0) {
						workgroupNames = workgroups.stream().map(Identity::getName).collect(Collectors.toList());
						Collections.sort(workgroupNames);
					}
					details.put("workgroups", workgroupNames);
				}	
			} else {
				throw new GeneralException("Can not retrieve identity object: " + id);
			}
			details.put("ownedEntitlements", IdentityService.getOwnedEntitlements(context, identity));
			details.put("ownedRoles", IdentityService.getOwnedRoles(context, identity));
		} catch (GeneralException e) {
			responseStatus = HttpStatus.INTERNAL_SERVER_ERROR;
			message = e.getMessage();
		}
		Map<String, Object> responseBody = new HashMap<String, Object>();
		responseBody.put("details", details);
		responseBody.put("message", message);
		return ResponseEntity.status(responseStatus).body(responseBody);
	}

	@Override
	public String getPluginName() {
		return PluginSettingService.getPluginName();
	}

}
