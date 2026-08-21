-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'student');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('sexual', 'lostandfound', 'suspicious', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'acknowledged', 'resolved', 'dismissed');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'student',
    "device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "boundary" TEXT,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "campus_id" UUID NOT NULL,
    "incident_type" "IncidentType" NOT NULL,
    "description" TEXT NOT NULL,
    "photo_url" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SosLog" (
    "id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "user_id" UUID,
    "device_id" TEXT,
    "dispatched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SosLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationNode" (
    "id" TEXT NOT NULL,
    "campus_id" UUID NOT NULL,
    "name" TEXT,
    "floor_level" INTEGER NOT NULL DEFAULT 1,
    "geom" TEXT,

    CONSTRAINT "NavigationNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationEdge" (
    "id" UUID NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "is_stairs" BOOLEAN NOT NULL DEFAULT false,
    "geom" TEXT,

    CONSTRAINT "NavigationEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "campus_id" UUID NOT NULL,
    "location_node_id" TEXT,
    "title" TEXT NOT NULL,
    "host_type" "Role" NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "event_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "event_id" UUID NOT NULL,
    "device_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("event_id","device_id")
);

-- CreateTable
CREATE TABLE "DailyActiveUser" (
    "device_id" TEXT NOT NULL,
    "login_date" DATE NOT NULL,

    CONSTRAINT "DailyActiveUser_pkey" PRIMARY KEY ("device_id","login_date")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_device_id_key" ON "User"("device_id");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosLog" ADD CONSTRAINT "SosLog_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SosLog" ADD CONSTRAINT "SosLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationNode" ADD CONSTRAINT "NavigationNode_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationEdge" ADD CONSTRAINT "NavigationEdge_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "NavigationNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationEdge" ADD CONSTRAINT "NavigationEdge_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "NavigationNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_location_node_id_fkey" FOREIGN KEY ("location_node_id") REFERENCES "NavigationNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
