package sailpoint.community.plugin.orgchartplugin.util;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Locale;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import sailpoint.api.SailPointContext;
import sailpoint.community.plugin.orgchartplugin.service.IdentityService;
import sailpoint.object.Configuration;
import sailpoint.tools.GeneralException;
import sailpoint.tools.JsonHelper;

public class Util extends sailpoint.tools.Util {

	public static final Log logger = LogFactory.getLog(IdentityService.class);
	
	public static String toJson(Object value) {
		String json = null;
		Class<JsonHelper> jsonHelperClazz = sailpoint.tools.JsonHelper.class;
		String methodName = "toJson";
		Method method;
		if (Util.isIIQVersionAfter82()) {
			try {
				method = jsonHelperClazz.getMethod(methodName, Object.class, JsonHelper.JsonOptions[].class);
				json = (String) method.invoke(null, value, new JsonHelper.JsonOptions[] {JsonHelper.JsonOptions.PRETTY_PRINT});
			} catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException | InvocationTargetException e) {
				logger.error(e);
			}
		} else {
			try {
				method = jsonHelperClazz.getMethod(methodName, Object.class);
				json = (String) method.invoke(null, value);
			} catch (NoSuchMethodException | SecurityException | IllegalAccessException | IllegalArgumentException | InvocationTargetException e) {
				logger.error(e);
			}
		}
		return json;
	}
	
	/** 
     * Check if IIQ version is after 8.1
     * @return boolean
     */
    public static boolean isIIQVersionAfter82() {
    	return isAfterIIQVersion(8, 2);
    }
    
    private static boolean isAfterIIQVersion(int mainVersion, int patchVersion) {
    	String iiqVersion = sailpoint.Version.getVersion();
		int pos = iiqVersion.indexOf(".");
		int majorVersion = 7;
		int minorVersion = 3;
		if (pos > 0) {
			majorVersion = Integer.valueOf(iiqVersion.substring(0, pos));
			minorVersion = Integer.valueOf(iiqVersion.substring(pos+1));
		}
		if (majorVersion >= mainVersion && minorVersion >= patchVersion) {
			return true;
		} else {
			return false;
		}
    }
    
    /**
     * Resolve the message value via message key, if locale is null then using default language from system configuration.
     * @param context
     * @param messageKey
     * @param locale
     * @return String
     * @throws GeneralException
     */
    public static String getLocalizedIIQMessage(SailPointContext context, String messageKey, String locale) {
    	String value = messageKey;
    	if (Util.smellsLikeMessageKey(messageKey)) {
    		if (Util.isNullOrEmpty(locale)) {
        		try {
    				locale = context.getConfiguration().getString(Configuration.DEFAULT_LANGUAGE);
    			} catch (GeneralException e) {
    				logger.error("getLocalizedIIQMessage, failed to get default language from system configuration: " + e);
    				return messageKey;
    			}
        	}
    		value = Util.getMessage(Util.getIIQMessages(getLocaleObject(locale)), messageKey);

    	}
		return value; 
    }
	
    /** 
     * Return the Locale object based on input string e.g. en_US
     * @param locale String
     * @return Locale
     */
    public static Locale getLocaleObject(String locale) {
    	if (locale.contains("-")) {
    		locale = locale.replace("-", "_");
    	}
    	String[] parts = locale.split("_");
		String language = parts[0];
		String country = null;
		if (parts.length > 1) {
			country = parts[1];
			return new Locale(language,country);
		} else {
			return new Locale(language);
		}
    }
}
