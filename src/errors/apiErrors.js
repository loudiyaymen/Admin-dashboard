export const API_ERRORS = {
  INVALID_JSON: { status: 400, message: "Invalid JSON" },
  BAD_REQUEST: { status: 400, message: "Bad request" },
  REQUEST_BODY_REQUIRED: { status: 400, message: "Request body is required" },
  REQUEST_BODY_MUST_BE_OBJECT: {
    status: 400,
    message: "Request body must be a JSON object",
  },
  NO_FIELDS_TO_UPDATE: { status: 400, message: "No fields to update" },
  NOT_FOUND: { status: 404, message: "Not found" },
  INTERNAL_SERVER_ERROR: { status: 500, message: "Internal server error" },
  UNAUTHORIZED: { status: 401, message: "Unauthorized" },
  INVALID_CREDENTIALS: { status: 401, message: "Invalid username or password" },
  AUTH_TOKEN_REQUIRED: {
    status: 401,
    message: "Authorization bearer token required",
  },
  AUTH_TOKEN_INVALID: { status: 401, message: "Invalid or expired token" },
  AUTH_TOKEN_REVOKED: { status: 401, message: "Token has been revoked" },
  USERNAME_REQUIRED: { status: 400, message: "username is required" },
  PASSWORD_REQUIRED: { status: 400, message: "password is required" },
  CURRENT_PASSWORD_REQUIRED: {
    status: 400,
    message: "currentPassword is required",
  },
  USERNAME_OR_PASSWORD_UPDATE_REQUIRED: {
    status: 400,
    message: "username or password must be provided",
  },

  ADMIN_ONLY: { status: 403, message: "Admin only" },
  EVENT_NOT_FOUND: { status: 404, message: "Event not found" },
  EVENT_NOT_FOUND_OR_INVALID: {
    status: 404,
    message: "Event not found or invalid data",
  },
  DRAW_WINNER_FAILED: { status: 500, message: "Failed to draw winner" },

  CAMPUS_ID_AND_NAME_REQUIRED: {
    status: 400,
    message: "campus_id and name required",
  },
  CAMPUS_NAME_REQUIRED: { status: 400, message: "name required" },

  BUILDING_REQUIRED_FIELDS: {
    status: 400,
    message: "building_id, campus_id, name required",
  },

  FLOOR_REQUIRED_FIELDS: {
    status: 400,
    message: "floor_id and building_id required",
  },

  ANNOUNCEMENT_REQUIRED_FIELDS: {
    status: 400,
    message: "announcement_id and title required",
  },

  ALERT_REQUIRED_FIELDS: {
    status: 400,
    message: "alert_id and message required",
  },
  ALERT_MESSAGE_REQUIRED: {
    status: 400,
    message: "message required",
  },

  DEVICE_INSTALLATION_ID_REQUIRED: {
    status: 400,
    message: "deviceInstallationId required (body or X-Device-Installation-Id)",
  },
  SOS_CAMPUS_ID_REQUIRED: { status: 400, message: "campusId required" },

  REPORT_INVALID_TYPE: { status: 400, message: "Invalid type value" },
  REPORT_INVALID_STATUS: { status: 400, message: "Invalid status value" },
  REPORT_DESCRIPTION_REQUIRED: {
    status: 400,
    message: "Description is required",
  },
  REPORT_CAMPUS_REQUIRED: { status: 400, message: "campus_id is required" },
  REPORT_ID_INVALID: { status: 400, message: "Invalid report ID" },
  REPORT_NOT_FOUND: { status: 404, message: "Report not found" },
};

export function sendError(res, errorDef, overrideMessage) {
  return res
    .status(errorDef.status)
    .json({ error: overrideMessage ?? errorDef.message });
}

export function sendInternalError(res) {
  return sendError(res, API_ERRORS.INTERNAL_SERVER_ERROR);
}
