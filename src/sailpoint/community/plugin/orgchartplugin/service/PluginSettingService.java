package sailpoint.community.plugin.orgchartplugin.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import sailpoint.api.SailPointContext;
import sailpoint.community.plugin.orgchartplugin.util.Util;
import sailpoint.object.IdentityTypeDefinition;
import sailpoint.object.ObjectConfig;
import sailpoint.object.UIConfig;
import sailpoint.plugin.PluginBaseHelper;
import sailpoint.tools.GeneralException;
import sailpoint.tools.JsonHelper;

public class PluginSettingService {

	private static final String PLUGIN_NAME = "orgchartplugin";
	private static final String SETTING_MANAGER_LEVELS = "levels";
	private static final String SETTING_IDENTITY_CARD_ATTRS = "identityCardAttributes";
	private static final String SETTING_IDENTITY_DETAIL_ATTRS = "identityDetailAttributes";
	private static final String SETTING_WORKGOUP_CARD_ATTRS = "workgroupCardAttributes";
	private static final String SETTING_IDENTITY_ICON_IMG_ATTR = "identityIconImgAttribute";
	private static final String SETTING_COLOR_CODE = "colorCodeSetting";
	private static final String SETTING_CONNECTION_RULE = "connectionRule";
	
	public static final Log logger = LogFactory.getLog(PluginSettingService.class);
	
	public static String getPluginName() {
		return PLUGIN_NAME;
	}
	
	public static int getSettingManagerLevels() {
		return PluginBaseHelper.getSettingInt(PLUGIN_NAME, SETTING_MANAGER_LEVELS);
	}
	
	public static List<String> getSettingIdentityCardAttrs() {
		String identityCardAttributesStr = PluginBaseHelper.getSettingString(PLUGIN_NAME, SETTING_IDENTITY_CARD_ATTRS);
		List<String> identityCardAttributesList = Util.csvToList(identityCardAttributesStr);
		if (Util.nullSafeSize(identityCardAttributesList) > 3) {
			identityCardAttributesList = identityCardAttributesList.subList(0, 3);
		}
		return identityCardAttributesList;
	}
	
	public static List<String> getSettingIdentityDetailAttrs(SailPointContext context) throws GeneralException {
		String identityDetailAttributesStr = PluginBaseHelper.getSettingString(PLUGIN_NAME, SETTING_IDENTITY_DETAIL_ATTRS);
		if (Util.isNullOrEmpty(identityDetailAttributesStr)) {
			UIConfig uiConfig = context.getObjectByName(UIConfig.class, "UIConfig");
			identityDetailAttributesStr = uiConfig.get("identityViewAttributes");
		}
		return Util.csvToList(identityDetailAttributesStr);
	}
	
	public static List<String> getSettingWorkgroupCardAttrs() {
		String identityCardAttributesStr = PluginBaseHelper.getSettingString(PLUGIN_NAME, SETTING_WORKGOUP_CARD_ATTRS);
		List<String> workgroupCardAttributesList = Util.csvToList(identityCardAttributesStr);
		if (Util.nullSafeSize(workgroupCardAttributesList) > 3) {
			workgroupCardAttributesList = workgroupCardAttributesList.subList(0, 3);
		}
		return workgroupCardAttributesList;
	}
	
	public static String getIdentityIconImgAttirbute() {
		return PluginBaseHelper.getSettingString(PLUGIN_NAME, SETTING_IDENTITY_ICON_IMG_ATTR);
	}

	public static Map<String, String> getColorCodeSettingMap() {
		Map<String, String> colorCodeMap = new HashMap<>();
		colorCodeMap.put("default", "#3AB6E3");
		String colorCodeSetting = PluginBaseHelper.getSettingString(PLUGIN_NAME, SETTING_COLOR_CODE);
		if (Util.isNotNullOrEmpty(colorCodeSetting)) {
			try {
				colorCodeMap.putAll(JsonHelper.mapFromJson(String.class, String.class, colorCodeSetting));
			} catch (GeneralException e) {
				e.printStackTrace();
			}
		}
		if (logger.isTraceEnabled()) {
			logger.trace("colorCodeMap: " + colorCodeMap);
		}
		return colorCodeMap;
	}

	public static String getSettingConnectionRule() {
		return PluginBaseHelper.getSettingString(PLUGIN_NAME, SETTING_CONNECTION_RULE);
	}
	
	public static Map<String, String> getNodeTypes(SailPointContext context, String locale) throws GeneralException {
		Map<String, String> nodeTypes = new HashMap<>();
		nodeTypes.put("workgroup", "Workgroup");
		nodeTypes.put("none", "None");
		nodeTypes.putAll(getIdentityTypes(context, locale));
		if (logger.isTraceEnabled()) {
			logger.trace("nodeTypes: " + nodeTypes);
		}
		return nodeTypes;
	}
	
	private static Map<String, String> getIdentityTypes(SailPointContext context, String locale) throws GeneralException {
		Map<String, String> identityTypes = new HashMap<>();
		ObjectConfig objConfig = context.getObjectByName(ObjectConfig.class, "Identity");
		if (objConfig != null) {
			List<IdentityTypeDefinition> idTypeDefs = objConfig.getIdentityTypesList();
			for (IdentityTypeDefinition idTypeDef : Util.safeIterable(idTypeDefs)) {
				identityTypes.put(idTypeDef.getName(), Util.getLocalizedIIQMessage(context, idTypeDef.getDisplayableName(), locale));
			}
		}
		return identityTypes;
	}
}
