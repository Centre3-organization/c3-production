DROP TABLE `shiftAssignments`;--> statement-breakpoint
DROP TABLE `shiftDefinitions`;--> statement-breakpoint
DROP TABLE `shiftSchedules`;--> statement-breakpoint
ALTER TABLE `approvalStages` MODIFY COLUMN `stageType` enum('individual','role','group','group_hierarchy','dynamic_field','manager','external_manager','site_manager','zone_owner','custom_resolver') NOT NULL;--> statement-breakpoint
ALTER TABLE `approvalTasks` MODIFY COLUMN `assignedVia` enum('direct','role','group','delegation','escalation','send_back','clarification_response') NOT NULL;--> statement-breakpoint
ALTER TABLE `stageApprovers` MODIFY COLUMN `approverType` enum('user','role','approval_role','group','group_role','hierarchy_level','dynamic_field','manager_chain') NOT NULL;--> statement-breakpoint
ALTER TABLE `workflowConditions` MODIFY COLUMN `conditionType` enum('process_type','category','sub_category','site_id','region','zone_id','area_id','requester_group','requester_type','requester_department','requester_role','activity_risk','has_mop','has_mhv','visitor_count','time_range','request_duration','vip_visit','working_hours','day_of_week','escort_required','access_level') NOT NULL;