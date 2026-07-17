import { prisma } from "../prismaClient.js";
import { sendInternalError } from "../errors/apiErrors.js";

export async function getDashboardMetrics(req, res) {
  try {
    const [alertCount, reportCount, sosCount, totalUsers] = await Promise.all([
      prisma.alert.count(),
      prisma.report.count(),
      prisma.sosLog.count(),
      prisma.user.count(),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [alertCountLastWeek, reportCountLastWeek, sosCountLastWeek] =
      await Promise.all([
        prisma.alert.count({
          where: { created_at: { gte: sevenDaysAgo } },
        }),
        prisma.report.count({
          where: { created_at: { gte: sevenDaysAgo } },
        }),
        prisma.sosLog.count({
          where: { dispatched_at: { gte: sevenDaysAgo } },
        }),
      ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeUsersToday = await prisma.dailyActiveUser.count({
      where: { login_date: { gte: today } },
    });

    const openReports = await prisma.report.count({
      where: { status: "pending" },
    });

    const resolvedReports = await prisma.report.count({
      where: { status: "resolved" },
    });

    const previousWeekStartDate = new Date(sevenDaysAgo);
    previousWeekStartDate.setDate(previousWeekStartDate.getDate() - 7);

    const [
      alertCountPreviousWeek,
      reportCountPreviousWeek,
      sosCountPreviousWeek,
    ] = await Promise.all([
      prisma.alert.count({
        where: {
          created_at: {
            gte: previousWeekStartDate,
            lt: sevenDaysAgo,
          },
        },
      }),
      prisma.report.count({
        where: {
          created_at: {
            gte: previousWeekStartDate,
            lt: sevenDaysAgo,
          },
        },
      }),
      prisma.sosLog.count({
        where: {
          dispatched_at: {
            gte: previousWeekStartDate,
            lt: sevenDaysAgo,
          },
        },
      }),
    ]);

    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const userEngagementRate =
      totalUsers > 0 ? Math.round((activeUsersToday / totalUsers) * 100) : 0;

    res.json({
      data: {
        recentNotifications: alertCount,
        notificationTrend: calculateTrend(
          alertCountLastWeek,
          alertCountPreviousWeek,
        ),
        reportsSubmitted: reportCount,
        reportTrend: calculateTrend(
          reportCountLastWeek,
          reportCountPreviousWeek,
        ),
        emergencyResponses: sosCount,
        emergencyTrend: calculateTrend(sosCountLastWeek, sosCountPreviousWeek),
        activeUsers: activeUsersToday,
        totalUsers,
        openReports,
        resolvedReports,
        pendingReports: openReports,
        userEngagementRate,
      },
    });
  } catch (error) {
    console.error("getDashboardMetrics error:", error);
    sendInternalError(res);
  }
}

export async function getResolutionRates(req, res) {
  try {
    const months = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      months.push({
        month: monthNames[date.getMonth()],
        startDate: new Date(date.getFullYear(), date.getMonth(), 1),
        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      });
    }

    const resolutionRates = await Promise.all(
      months.map(async (m) => {
        const totalReports = await prisma.report.count({
          where: {
            created_at: {
              gte: m.startDate,
              lte: m.endDate,
            },
          },
        });

        const resolvedReports = await prisma.report.count({
          where: {
            created_at: {
              gte: m.startDate,
              lte: m.endDate,
            },
            status: "resolved",
          },
        });

        const rate =
          totalReports === 0
            ? 0
            : Math.round((resolvedReports / totalReports) * 100);

        return {
          month: m.month,
          rate,
        };
      }),
    );

    res.json({ data: resolutionRates });
  } catch (error) {
    console.error("getResolutionRates error:", error);
    sendInternalError(res);
  }
}

export async function getActivityOverview(req, res) {
  try {
    const days = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      days.push({
        day: `Day ${30 - i}`,
        date,
        nextDate: nextDay,
      });
    }

    const activityData = await Promise.all(
      days.map(async (d) => {
        const [reportCount, alertCount, eventCount] = await Promise.all([
          prisma.report.count({
            where: {
              created_at: {
                gte: d.date,
                lt: d.nextDate,
              },
            },
          }),
          prisma.alert.count({
            where: {
              created_at: {
                gte: d.date,
                lt: d.nextDate,
              },
            },
          }),
          prisma.event.count({
            where: {
              event_date: {
                gte: d.date,
                lt: d.nextDate,
              },
            },
          }),
        ]);

        return {
          day: d.day,
          value: reportCount + alertCount + eventCount,
        };
      }),
    );

    res.json({ data: activityData });
  } catch (error) {
    console.error("getActivityOverview error:", error);
    sendInternalError(res);
  }
}

export async function getActiveUsersTrend(req, res) {
  try {
    const weeks = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      weeks.push({
        week: `W${8 - i}`,
        startDate: weekStart,
        endDate: weekEnd,
      });
    }

    const trendData = await Promise.all(
      weeks.map(async (w) => {
        const uniqueUsers = await prisma.dailyActiveUser.findMany({
          where: {
            login_date: {
              gte: w.startDate,
              lt: w.endDate,
            },
          },
          select: { device_id: true },
          distinct: ["device_id"],
        });

        return {
          day: w.week,
          value: uniqueUsers.length,
        };
      }),
    );

    res.json({ data: trendData });
  } catch (error) {
    console.error("getActiveUsersTrend error:", error);
    sendInternalError(res);
  }
}

export async function getReportDistribution(req, res) {
  try {
    const typeMapping = {
      lostandfound: "Lost Item",
      suspicious: "Safety Concern",
      sexual: "Sexual Violence",
      other: "Damaged Vehicle",
    };

    const distribution = await prisma.report.groupBy({
      by: ["incident_type"],
      _count: {
        id: true,
      },
    });

    const data = distribution.map((item) => ({
      label: typeMapping[item.incident_type] || item.incident_type,
      value: item._count.id,
    }));

    res.json({ data });
  } catch (error) {
    console.error("getReportDistribution error:", error);
    sendInternalError(res);
  }
}

export async function getAlertMetrics(req, res) {
  try {
    const totalAlerts = await prisma.alert.count();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const criticalAlerts = await prisma.alert.count({
      where: {
        created_at: { gte: thirtyDaysAgo },
        severity: {
          in: ["critical", "high"],
        },
      },
    });

    const recentAlerts = await prisma.alert.findMany({
      where: { created_at: { gte: thirtyDaysAgo } },
      select: { alert_id: true, created_at: true, severity: true },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    let totalOpenRate = 0;
    if (recentAlerts.length > 0) {
      recentAlerts.forEach((alert) => {
        const ageInDays =
          (Date.now() - alert.created_at.getTime()) / (1000 * 60 * 60 * 24);
        let openRate = Math.min(95, 40 + ageInDays * 2);
        if (alert.severity === "critical") openRate += 10;
        totalOpenRate += openRate;
      });
    }

    const averageOpenRate =
      recentAlerts.length > 0
        ? Math.round(totalOpenRate / recentAlerts.length)
        : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const previousWeekStart = new Date(sevenDaysAgo);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const [alertsLastWeek, alertsPreviousWeek] = await Promise.all([
      prisma.alert.count({
        where: { created_at: { gte: sevenDaysAgo } },
      }),
      prisma.alert.count({
        where: {
          created_at: {
            gte: previousWeekStart,
            lt: sevenDaysAgo,
          },
        },
      }),
    ]);

    const alertTrend =
      alertsPreviousWeek === 0
        ? alertsLastWeek > 0
          ? 100
          : 0
        : Math.round(
            ((alertsLastWeek - alertsPreviousWeek) / alertsPreviousWeek) * 100,
          );

    res.json({
      data: {
        totalSent: totalAlerts,
        openRate: averageOpenRate,
        criticalAlerts,
        trend: alertTrend,
      },
    });
  } catch (error) {
    console.error("getAlertMetrics error:", error);
    sendInternalError(res);
  }
}
