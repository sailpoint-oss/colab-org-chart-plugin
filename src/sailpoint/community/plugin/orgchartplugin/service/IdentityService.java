package sailpoint.community.plugin.orgchartplugin.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import sailpoint.api.IdIterator;
import sailpoint.api.ObjectUtil;
import sailpoint.api.SailPointContext;
import sailpoint.community.plugin.orgchartplugin.util.Util;
import sailpoint.object.Bundle;
import sailpoint.object.Filter;
import sailpoint.object.Identity;
import sailpoint.object.ManagedAttribute;
import sailpoint.object.ObjectConfig;
import sailpoint.object.PolicyViolation;
import sailpoint.object.QueryOptions;
import sailpoint.object.RoleAssignment;
import sailpoint.tools.GeneralException;
import sailpoint.tools.JsonHelper;

public class IdentityService {
	
	private static final String ATT_MANAGES_COUNT = "managesCount";
	private static final String ATTR_INACTIVE = "inactive";
	private static final String ATT_MEMBERSHIP_COUNT = "membershipCount";
	private static final String ATTR_IDENTITY_ICON_IMG_ATTRIBUTE = "identityIconImgAttribute";
	private static final String ATTR_MEMBER_COUNT = "memberCount";
	private static final String ATTR_ATTRIBUTES = "attributes";
	private static final String ATTR_ID = "id";
	private static final String ATTR_NAME = "name";
	private static final String ATTR_DISPLAYNAME = "displayName";
	private static final String ATTR_TYPE = "type";
	private static final String ATTR_COLOR_CODE = "colorCode";
	private static final String ATTR_PARENT = "parentId";
	private static final String TYPE_WORKGROUP = "workgroup";
	private static final String TYPE_DEFAULT = "default";
	
	
	public static final Log logger = LogFactory.getLog(IdentityService.class);
	
	public static List<Map<String, Object>> getTreeNodes(SailPointContext context, String id) throws GeneralException {
		Identity identity = context.getObjectById(Identity.class, id);
		if (identity == null) {
			throw new GeneralException("Can not find identity object: " + id);
		}
		List<Map<String, Object>> nodes = new ArrayList<>();
		List<String> all = new ArrayList<>();
		List<String> childs = getChilds(context, id);
		logger.trace("childs: " + childs);
		all.addAll(childs);
		List<String> parents = getParents(context, identity, PluginSettingService.getSettingManagerLevels(), new ArrayList<>());
		String rootId = null;
		if (Util.nullSafeSize(parents) > 0) {
			rootId = parents.get(parents.size() - 1);
		} else {
			rootId = id;
		}
		logger.trace("parents: " + parents);
		all.addAll(parents);
		List<String> siblings = getSiblings(context, identity);
		logger.trace("siblings: " + siblings);
		all.addAll(siblings);
		Util.removeDuplicates(all);
		for (String _id : Util.safeIterable(all)) {
			Identity node;
			try {
				node = context.getObjectById(Identity.class, _id);
			} catch (GeneralException e) {
				// TODO: enhance with error handling
				logger.error("Failed to retrieve Identity object(" + _id + "): " + e);
				continue;
			}
			// Mandatory attributes: id, name, parentId, displayName
			try {
				nodes.add(getNodeMap(context, node, rootId));
			} catch (GeneralException e) {
				// TODO: enhance with error handling
				logger.error("Failed to build node map(" + _id + "): " + e);
				continue;
			}
		}
		if (logger.isTraceEnabled()) {
			logger.trace("Exit getTreeNodes, nodes: " + nodes);
		}
		return nodes;
	}
	
	public static List<String> getChilds(SailPointContext context, String id) throws GeneralException {
		List<String> childs = new ArrayList<>();
		childs.addAll(getManagedMembers(context, id));
		childs.addAll(getOwnedWorkgroups(context, id));
		return childs;
	}
	
	private static List<String> getManagedMembers(SailPointContext context, String id) throws GeneralException {
		List<String> members = new ArrayList<>();
		QueryOptions qo = new QueryOptions();
		Filter filter = Filter.eq("manager.id", id);
		qo.add(filter);
		Iterator<Object[]> it = context.search(Identity.class, qo, "id");
		IdIterator idIt = new IdIterator(context, it);
		while (idIt.hasNext()) {
			String _id = idIt.next();
			members.add(_id);
		}
		return members;
	}
	
	private static int getManagedCount(SailPointContext context, String id) throws GeneralException {
		QueryOptions qo = new QueryOptions();
		Filter filter1 = Filter.and(Filter.eq("manager.id", id), Filter.eq("workgroup", false));
		Filter filter2 = Filter.and(Filter.eq("owner.id", id), Filter.eq("workgroup", true));
		Filter filter = Filter.or(filter1, filter2);
		qo.add(filter);
		return context.countObjects(Identity.class, qo);
	}
	
	private static List<String> getOwnedWorkgroups(SailPointContext context, String id) throws GeneralException {
		List<String> workgroups = new ArrayList<>();
		QueryOptions qo = new QueryOptions();
		Filter filter = Filter.and(Filter.eq("owner.id", id), Filter.eq("workgroup", true));
		qo.add(filter);
		Iterator<Object[]> it = context.search(Identity.class, qo, "id");
		IdIterator idIt = new IdIterator(context, it);
		while (idIt.hasNext()) {
			String _id = idIt.next();
			workgroups.add(_id);
		}
		return workgroups;
	}
	
	public static List<String> getParents(SailPointContext context, Identity identity, int level, List<String> reportTos) {
		logger.trace("getParents, level: " + level);
		logger.trace("getParents, identityName: " + identity.getName());
		logger.trace("getParents, reportTos: " + reportTos);
		if (level == 0) {
			return reportTos;
		} else {
			if (identity.getManager() != null) {
				String managerId = identity.getManager().getId();
				if (reportTos.contains(managerId)) {
					// Close loop found
					return reportTos;
				} else {
					reportTos.add(managerId);
					return getParents(context, identity.getManager(), --level, reportTos);
				}
			} else if (identity.isWorkgroup() && identity.getOwner() != null) { // Workgroup
				String ownerId = identity.getOwner().getId();
				if (reportTos.contains(ownerId)) {
					// Close loop found
					return reportTos;
				} else {
					reportTos.add(ownerId);
					return getParents(context, identity.getOwner(), --level, reportTos);
				}
			} else {
				return reportTos;
			}
		}
	}
	
	/**
	 * Return siblings including self
	 * 
	 * @param context
	 * @param identity
	 * @return
	 * @throws GeneralException
	 */
	public static List<String> getSiblings(SailPointContext context, Identity identity) throws GeneralException {
		List<String> siblings = new ArrayList<>();
		Identity parent = null;
		if (identity.isWorkgroup()) {
			parent = identity.getOwner();
		} else {
			parent = identity.getManager();
		}		
		if (parent != null) {
			siblings = getChilds(context, parent.getId());
		} else { // No manager or owner
			siblings.add(identity.getId());
		}
		return siblings;
	}
	
	// TODO: enhance the loading attribute logic
	public static Map<String, Object> getNodeMap(SailPointContext context, Identity node, String rootId) throws GeneralException {
		if (logger.isTraceEnabled()) {
			logger.trace("Enter getNodeMap...");
			logger.trace("Node: " + node.getName());
			logger.trace("Root Id: " + rootId);
		}
		Map<String, Object> nodeMap = new HashMap<>();
		nodeMap.put(ATTR_ID, node.getId());
		nodeMap.put(ATTR_NAME, node.getName());
		nodeMap.put(ATTR_DISPLAYNAME, node.getDisplayableName());
		if (node.isWorkgroup()) {
			nodeMap.putAll(getWorkgroupNodeMap(context, node, rootId));
		} else {
			nodeMap.putAll(getIdentityNodeMap(context, node, rootId));
		}
		
		if (logger.isTraceEnabled()) {
			logger.trace("Exit getNodeMap, nodeMap: " + nodeMap);
		}
		return nodeMap;
	}

	private static Map<String, Object> getWorkgroupNodeMap(SailPointContext context, Identity node, String rootId) throws GeneralException {
		Map<String, Object> map = new HashMap<>();
		map.put(ATTR_TYPE, TYPE_WORKGROUP);
		map.put(ATTR_COLOR_CODE, getColorCode(TYPE_WORKGROUP));
		if (rootId != null && rootId.equals(node.getId())) {
			map.put(ATTR_PARENT, null);
		} else {
			map.put(ATTR_PARENT, getParentNodeId(node, node.getOwner()));
		}
		map.put(ATT_MANAGES_COUNT, getManagedCount(context, node.getId()));
		// Custom attributes
		List<String> customWorkgroupCardAttrs = PluginSettingService.getSettingWorkgroupCardAttrs();
		for (String attr : Util.safeIterable(customWorkgroupCardAttrs)) {
			if ("description".equals(attr)) {
				map.put(attr, node.getDescription());
			} else {
				map.put(attr, node.getAttribute(attr));
			}
		}
		map.put(ATTR_ATTRIBUTES, customWorkgroupCardAttrs);
		try {
			map.put(ATTR_MEMBER_COUNT, Util.nullSafeSize(getMembers(context, node, "id")));
			map.put("members", getMembers(context, node, "displayName"));
		} catch (GeneralException e) {
			logger.error("Failed to get members for workgroup: " + node.getName());
		}
		return map;
	}

	private static Map<String, Object> getIdentityNodeMap(SailPointContext context, Identity node, String rootId) throws GeneralException {
		Map<String, Object> map = new HashMap<>();
		map.put(ATTR_TYPE, (node.getType() != null ? node.getType() : "none"));
		map.put(ATTR_COLOR_CODE, getColorCode(node.getType()));
		if (rootId != null && rootId.equals(node.getId())) {
			map.put(ATTR_PARENT, null);
		} else {
			map.put(ATTR_PARENT, getParentNodeId(node, node.getManager()));
		}
		map.put(ATT_MANAGES_COUNT, getManagedCount(context, node.getId()));
		map.put(ATTR_INACTIVE, node.isInactive());
		// Custom attributes
		List<String> customIdentityCardAttrs = PluginSettingService.getSettingIdentityCardAttrs();
		for (String attr : Util.safeIterable(customIdentityCardAttrs)) {
			map.put(attr, node.getAttribute(attr));
		}
		map.put(ATTR_ATTRIBUTES, customIdentityCardAttrs);
		map.putAll(getIconImg(node));
		// Workgroups
		List<Identity> workgroups = node.getWorkgroups();
		List<String> workgroupIds = new ArrayList<>();
		if (Util.nullSafeSize(workgroups) > 0) {
			workgroupIds= workgroups.stream().map(Identity::getId).collect(Collectors.toList());
		}
		map.put(ATT_MEMBERSHIP_COUNT, Util.nullSafeSize(workgroups));
		map.put("workgroups", workgroupIds);
		// Assigned roles
		List<Bundle> assignedRoles = node.getAssignedRoles();
		List<String> assignedRoleIds = new ArrayList<>();
		if (Util.nullSafeSize(assignedRoles) > 0) {
			assignedRoleIds= assignedRoles.stream().map(Bundle::getId).collect(Collectors.toList());
		}
		map.put("assignedRoles", assignedRoleIds);
		// Detected roles
		List<Bundle> detectedRoles = node.getDetectedRoles();
		List<String> detectedRoleIds = new ArrayList<>();
		if (Util.nullSafeSize(detectedRoles) > 0) {
			detectedRoleIds= detectedRoles.stream().map(Bundle::getId).collect(Collectors.toList());
		}
		map.put("detectedRoles", detectedRoleIds);
		map.put("policyViolationsCount", getNumberOfPolicyViolations(context, node));
		return map;
	}
	
	private static String getColorCode(String type) {
		Map<String, String> colorCodeMap = PluginSettingService.getColorCodeSettingMap();
		if (Util.isNotNullOrEmpty(type) && colorCodeMap.containsKey(type)) {
			return colorCodeMap.get(type);
		} else {
			return colorCodeMap.get(TYPE_DEFAULT);
		}
	}
	
	private static String getParentNodeId(Identity node, Identity parent) {
		if (parent != null) {
			return parent.getId();	
		} else {
			return null;
		}
	}
	
	private static Map<String, Object> getIconImg(Identity node) {
		Map<String, Object> map = new HashMap<>();
		String iconImgAttr = PluginSettingService.getIdentityIconImgAttirbute();
		if (Util.isNotNullOrEmpty(iconImgAttr)) {
			map.put(ATTR_IDENTITY_ICON_IMG_ATTRIBUTE, iconImgAttr);
			if (Util.isNotNullOrEmpty(node.getStringAttribute(iconImgAttr))) {
				map.put(iconImgAttr, node.getStringAttribute(iconImgAttr));
			}
		}
		return map;
	}
	
	public static List<String> getMembers(SailPointContext context, Identity workgroup, String attribute) throws GeneralException {
		List<String> result = new ArrayList<>();
		List<String> props = new ArrayList<>();
		props.add(attribute);
		Iterator<Object[]> it = ObjectUtil.getWorkgroupMembers(context, workgroup, props);
		while (it.hasNext()) {
			String value = Util.otos(it.next()[0]);
			result.add(value);
		}
		Util.flushIterator(it);
		Collections.sort(result);
		return result;
	}
	
	/**
	 * Get Active RoleAssignments in json format  
	 * 
	 * @param context SailPointContext
	 * @param identity Identity
	 * @param filterRoles List<Map<String, Object>>
	 * @param showAll boolean
	 * @param locale String
	 * @return List<Map<String, Object>>
	 * @throws GeneralException
	 */
	public static List<Map<String, Object>> getActiveRoleAssignments(SailPointContext context, Identity identity) throws GeneralException {
		if (logger.isTraceEnabled()) {
			logger.trace("Enter getActiveRoleAssignments...");
		}
		List<Map<String, Object>> roleAssignmentListOfMap = null;
		if (!identity.isWorkgroup()) {
			Comparator<Map<String, Object>> mapComparator = new Comparator<Map<String, Object>>() {
		        public int compare(Map<String, Object> m1, Map<String, Object> m2) {
		            return Util.otos(m1.get("roleName")).compareTo(Util.otos(m2.get("roleName")));
		        }
		    };
			List<RoleAssignment> roleAssignments = identity.getActiveRoleAssignments();	
			roleAssignmentListOfMap = JsonHelper.listOfMapsFromJson(String.class, Object.class, Util.toJson(roleAssignments));
			Collections.sort(roleAssignmentListOfMap, mapComparator);
		} else {
			logger.trace(identity.getName() + " is a workgroup, no role assignments available.");
		}
		
		if (logger.isTraceEnabled()) {
			logger.trace("Exit getActiveRoleAssignments, roleAssignmentsJson: " + roleAssignmentListOfMap);
		}
		return roleAssignmentListOfMap;
	}
	
	public static List<Map<String, String>> getIdentityDetailAttributes(SailPointContext context, Identity identity) throws GeneralException {
		ObjectConfig objectConfg = context.getObjectByName(ObjectConfig.class, "Identity");
		List<Map<String, String>> result = new ArrayList<>();
		List<String> attributes = PluginSettingService.getSettingIdentityDetailAttrs(context);
		for (String attr : Util.safeIterable(attributes)) {
			Map<String, String> map = new HashMap<>();
			if (objectConfg.hasObjectAttribute(attr)) {
				map.put("attribute", objectConfg.getDisplayName(attr));
			} else {
				map.put("attribute", attr);
			}
			map.put("value", Util.otos(identity.getAttribute(attr)));
			result.add(map);
		}
		return result;
	}
	
	public static List<String> getPolicyViolations(SailPointContext context, Identity node) throws GeneralException {
		List<String> result = new ArrayList<>();
		List<PolicyViolation> pvList = ObjectUtil.getPolicyViolations(context, node);
		result = pvList.stream().map(pv -> {
			try {
				return pv.getDisplayableName();
			} catch (GeneralException e) {
				logger.error("getPolicyViolations: " + e);
			}
			return pv.getName();
		}).collect(Collectors.toList());
		return result;
	}
	
	public static int getNumberOfPolicyViolations(SailPointContext context, Identity node) throws GeneralException {
		return Util.nullSafeSize(ObjectUtil.getPolicyViolations(context, node));
	}
	
	public static List<String> getOwnedEntitlements(SailPointContext context, Identity node) throws GeneralException {
		List<String> result = new ArrayList<>();
		QueryOptions qo = new QueryOptions();
		qo.add(Filter.eq("owner.id", node.getId()));
		qo.addOrdering("application.name", true);
		Iterator<ManagedAttribute> it = context.search(ManagedAttribute.class, qo);
		while (it.hasNext()) {
			try {
				ManagedAttribute ma = it.next();
				String value = "[" + ma.getApplication().getName() + "]" + (ma.getName() != null ? ma.getName() : "") + " :" + ma.getDisplayableName();
				result.add(value);
			} catch (Exception e) {
				logger.error("getOwnedEntitlements, exception: " + e);
			}
		}
		Util.flushIterator(it);
		return result;
	}
	
	public static List<String> getOwnedRoles(SailPointContext context, Identity node) throws GeneralException {
		List<String> result = new ArrayList<>();
		QueryOptions qo = new QueryOptions();
		qo.add(Filter.eq("owner.id", node.getId()));
		qo.addOrdering("name", true);
		Iterator<Bundle> it = context.search(Bundle.class, qo);
		while (it.hasNext()) {
			String value = it.next().getDisplayableName();
			result.add(value);
		}
		Util.flushIterator(it);
		return result;
	}
}
