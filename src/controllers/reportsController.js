import { query } from '../db.js';



export async function getAll(req, res) {
    try {
        const {sort_by = 'created_at', order = 'DESC', } = req.query;
        const validSortFields = ['created_at', 'priority', 'status'];
        const validOrder = ['ASC', 'DESC'];

        //validate queries
        if (!validSortFields.includes(sort_by)) {
            return res.status(400).json({ error: 'Invalid sort field' });
        }
            
        if (!validOrder.includes(order.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid order' });
        }

        //slq logic to fetch em all
        const sql = `SELECT report_id, building_id, description, priority, status, created_at FROM reports ORDER BY 
        ${sort_by} ${order.toUpperCase()}`;
        const result = await query(sql);

        //return em all
        res.json(result.rows);
        
    }catch (e){
        res.status(500).json({ error: e.message });
    }
};

export async function getOne(req, res) {
    try {
        const result = await query('SELECT report_id, building_id, description, priority, status, created_at FROM reports WHERE report_id = $1', 
            [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);

    }catch (e){
        res.status(500).json({ error: e.message });
    }
};



export async function deleteOne(req, res) {
    try {
        const result = await query('DELETE FROM reports WHERE report_id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not foud' });
        res.json(204).send();
    }catch (e){
        res.status(500).json({ error: e.message });
    }
};



