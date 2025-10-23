#!/usr/bin/env node

/**
 * 데이터베이스 마이그레이션 스크립트
 * 
 * 사용법:
 *   node scripts/migrate.js
 * 
 * 주의: 이 스크립트는 배포 전 또는 처음 설정 시 한 번만 실행하면 됩니다.
 * API는 자동으로 테이블을 확인하고 생성합니다.
 */

import { ensureTablesExist } from '../lib/schema.js';
import pool from '../lib/db.js';

async function migrate() {
    console.log('🚀 데이터베이스 마이그레이션 시작...\n');
    
    try {
        await ensureTablesExist();
        
        console.log('✅ 마이그레이션 완료!\n');
        console.log('생성된 테이블:');
        console.log('  - comments (댓글)');
        console.log('  - likes (좋아요)');
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
        process.exit(1);
    }
}

migrate();

