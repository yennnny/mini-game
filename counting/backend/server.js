const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API: 게임 기록 저장 (1 to 50 클리어 타임)
app.post('/api/records', async (req, res) => {
    try {
        const { game_id, user_id, clear_time, school_id } = req.body;
        
        // Validation
        if (!game_id || !user_id || !clear_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await pool.execute(
            'INSERT INTO game_records (game_id, user_id, clear_time, school_id) VALUES (?, ?, ?, ?)',
            [game_id, user_id, clear_time, school_id || null]
        );
        
        res.status(201).json({ success: true, recordId: result.insertId });
    } catch (error) {
        console.error('Error saving record:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: 개인 랭킹 조회
app.get('/api/records/ranking/individual', async (req, res) => {
    try {
        const { game_id = 1, limit = 10 } = req.query; // Default game_id 1 (1 to 50)
        
        const [rows] = await pool.execute(`
            SELECT r.user_id, r.clear_time, r.played_at, u.username -- u.username assumes a users table or join
            FROM game_records r
            -- LEFT JOIN users u ON r.user_id = u.id -- 주석 해제하여 실제 유저 정보와 조인
            WHERE r.game_id = ?
            ORDER BY r.clear_time ASC
            LIMIT ?
        `, [game_id, parseInt(limit)]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// API: 학교별 랭킹 조회
app.get('/api/records/ranking/school', async (req, res) => {
    try {
        const { game_id = 1, limit = 10 } = req.query;
        
        // 학교별 평균 클리어 타임 또는 최소 클리어 타임 기준으로 랭킹 집계
        // 여기서는 상위 10개 학교의 평균 시간으로 예시 작성
        const [rows] = await pool.execute(`
            SELECT school_id, MIN(clear_time) as best_time
            FROM game_records
            WHERE game_id = ? AND school_id IS NOT NULL
            GROUP BY school_id
            ORDER BY best_time ASC
            LIMIT ?
        `, [game_id, parseInt(limit)]);
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching school rankings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
