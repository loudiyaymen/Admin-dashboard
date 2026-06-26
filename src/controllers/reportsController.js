// This file contains the controller functions for handling CRUD operations on reports.
import { query } from '../db.js';


//fetch all reports with optional sorting and ordering
export async function getAll(req, res) {
    try {

        const{
            sort_by = "created_at",
            order = "DESC",
            page = 1,
            limit = 10,
            status,
            type,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const offset = (pageNum - 1) * limitNum;

        const validSortFields = ["id", "type", "status", "created_at", "floor_id"];
        const validOrder = ["ASC", "DESC"];
        const validStatuses = ["new", "in_review", "resolved"];
        const validTypes = ["lost_item", "damaged_vehicle", "safety_concern", "sexual_violence"];

        const field = validSortFields.includes(sort_by) ? sort_by : "created_at";
        const direction = validOrder.includes(order.toUpperCase()) ? order.toUpperCase() : "DESC";
        const conditions = [];
        const params = [];

        if (type && validTypes.includes(type)){
            conditions.push(`type = $${params.length + 1}`);
            params.push(type);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const dataQuery = `
            SELECT id, type, description, floor_id, position, status, created_at
            FROM reports
            ${whereClause}
            ORDER BY ${field} ${direction}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const countQuery = `SELECT COUNT(*) FROM reports ${whereClause}`;
        const [dataResult, countResult] = await Promise.all([
            query(dataQuery, [...params, limitNum, offset]),
            query(countQuery, params)
        ]);

        res.status(200).json({
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].count),
            page: pageNum,
            limit: limitNum,
        });
        
    }catch (error){
        console.error("getAll error:", error);
        res.status(500).json({ error: "Internal Server Error"});
    }
};

//create a new report with uplade foto logic
export async function createOne(req, res) {

    try{
        const { type, description, floor_id, position } = req.body;
        const file = req.file;
        const validTypes = ["lost_item", "damaged_vehicle", "safety_concern", "sexual_violence"];

        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid type value' });
        }

        if (!description || description.trim() === "") {
            return res.status(400).json({ error: 'Description is required' });
        }

        let parsedPosition = null;
        if (position) {

            try {
                parsedPosition = JSON.parse(position);
            } catch {
                return res.status(400).json({ error: 'Invalid position format. Must be a JSON object.' });
            }
        } 

        const parseFloorId = floor_id ? parseInt(floor_id) : null;

        const result = await query(
            `INSERT INTO reports (type, description, floor_id, position) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, type, description, floor_id, position, status, created_at`,
            [type, description.trim(), parseFloorId, parsedPosition]
        );

        const report = result.rows[0];

        if (file){
            await query(
                `INSERT INTO report_attachments (report_id, object_storage_key, mime_type, size) 
                VALUES ($1, $2, $3, $4)`,
                [report.id, file.path, file.mimetype, file.size]
            );
        }


        res.status(201).json(report);

    }catch(error){
        console.error("createOne error:", error);
        res.status(500).json({ error: "Internal Server Error "});
    }
}

//fetch a report by a specific Id
export async function getOne(req, res) {
    try {

        const id  = Number(req.params.id);

        // Validate the id
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid report ID' });
        }


        const result = await query(`
            SELECT r.id, r.type, r.description, r.floor_id, r.position, r.status, r.created_at,
            COALESCE(
                json_agg(
                    json_build_object(
                    'id', a.id,
                    'object_storage_key', a.object_storage_key,
                    'mime_type', a.mime_type,
                    'size', a.size
                    'created_at', a.created_at
                    
                    )
                ) FILTER (WHERE a.id IS NOT NULL), '[]'
            ) AS attachments
            FROM reports r
            LEFT JOIN attachments a ON a.report_id =  r.id
            WHERE r.id = $1
            GROUP BY r.id`
            , 
            [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Report Not found' });

        res.status(200).json(result.rows[0]);

    }catch (error){
        console.error("getOne error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//update the status of a report
export async function updateOne(req, res) {

    try{

        const id = Number(req.params.id) ;
        const { status } = req.body;

        if (!Number.isInterger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid report ID' });
        }

        const validStatuses = ["new", "in_progress", "resolved"];
        if (!status || !validStatuses.includes(status)) {  
            return res.status(400).json({ error: 'Invalid status value' });
         }
        

        const result = await query( ` 
        UPDATE reports
        SET status = $1
        WHERE id = $2
        RETURNING id, type, description, floor_id, position, status, created_at`
        [status, id]
    );
        if (result.rows.length === 0 ){
            return res.status(404).json({ error: 'Report not found' });
        }

        res.status(200).json(result.rows[0]);
        
    }catch (error){
        console.error("updateOne error:", error);
        res.status(500).json({ error: "Internal Server Error "});
    }
    
}


//delete the report by a specific Id
export async function deleteOne(req, res) {
    try {

        const id = Number(req.params.id);

        
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid report ID' });
        }

        const result = await query(
            'DELETE FROM reports WHERE id = $1 '
        ,
            [id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Not foud' });


        res.json(204).send();

    }catch (error){
        console.error("deleteOne error:", error);
        res.status(500).json({ error: "Internal Server Error "});
    }
};



