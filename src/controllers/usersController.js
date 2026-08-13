import { prisma } from "../prismaClient.js";
import {
  API_ERRORS,
  sendError,
  sendInternalError,
} from "../errors/apiErrors.js";

export async function logDailyActiveUser(req, res) {
  try {
    const { device_id } = req.body;

    if (!device_id) {
      return sendError(res, API_ERRORS.BAD_REQUEST, "device_id is required");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logged = await prisma.dailyActiveUser.upsert({
      where: {
        device_id_login_date: {
          device_id,
          login_date: today,
        },
      },
      update: {},
      create: {
        device_id,
        login_date: today,
      },
    });

    res.status(201).json({
      data: logged,
      message: "Daily active user logged successfully",
    });
  } catch (error) {
    console.error("logDailyActiveUser error:", error);
    sendInternalError(res);
  }
}

export async function getActiveUsersCount(req, res) {
  try {
    const { start_date, end_date } = req.query;

    const startDate = new Date(start_date || new Date());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end_date || new Date());
    endDate.setHours(23, 59, 59, 999);

    const activeUsers = await prisma.dailyActiveUser.findMany({
      where: {
        login_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      distinct: ["device_id"],
      select: {
        device_id: true,
        login_date: true,
      },
    });

    const uniqueDevices = new Set(activeUsers.map((u) => u.device_id));

    res.json({
      data: {
        date_range: {
          start: startDate,
          end: endDate,
        },
        total_active_users: uniqueDevices.size,
        records: activeUsers,
      },
    });
  } catch (error) {
    console.error("getActiveUsersCount error:", error);
    sendInternalError(res);
  }
}
