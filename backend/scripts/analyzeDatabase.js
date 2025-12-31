#!/usr/bin/env node

/**
 * Database Analysis Script
 * 
 * Analyzes database performance and identifies optimization opportunities:
 * - Slow queries
 * - Missing indexes
 * - Table sizes
 * - Query patterns
 * 
 * Usage:
 *   node scripts/analyzeDatabase.js
 */

const { sequelize } = require('../sequelize_setup');
const fs = require('fs');
const path = require('path');

/**
 * Get table sizes
 */
async function getTableSizes() {
    console.log('\n📊 Table Sizes:');
    console.log('─'.repeat(60));

    const query = `
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
            pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY size_bytes DESC;
    `;

    try {
        const [results] = await sequelize.query(query);

        results.forEach(row => {
            console.log(`  ${row.tablename.padEnd(30)} ${row.size}`);
        });

        return results;
    } catch (error) {
        console.error('Error getting table sizes:', error.message);
        return [];
    }
}

/**
 * Get index information
 */
async function getIndexes() {
    console.log('\n🔍 Indexes:');
    console.log('─'.repeat(60));

    const query = `
        SELECT
            t.tablename,
            indexname,
            indexdef
        FROM pg_indexes i
        JOIN pg_tables t ON i.tablename = t.tablename
        WHERE t.schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY t.tablename, indexname;
    `;

    try {
        const [results] = await sequelize.query(query);

        let currentTable = '';
        results.forEach(row => {
            if (row.tablename !== currentTable) {
                console.log(`\n  Table: ${row.tablename}`);
                currentTable = row.tablename;
            }
            console.log(`    - ${row.indexname}`);
        });

        return results;
    } catch (error) {
        console.error('Error getting indexes:', error.message);
        return [];
    }
}

/**
 * Analyze query performance (if pg_stat_statements is available)
 */
async function analyzeQueries() {
    console.log('\n⚡ Query Performance Analysis:');
    console.log('─'.repeat(60));

    // Check if pg_stat_statements is available
    const checkQuery = `
        SELECT EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        ) AS available;
    `;

    try {
        const [checkResult] = await sequelize.query(checkQuery);

        if (!checkResult[0].available) {
            console.log('  ⚠️  pg_stat_statements extension not available');
            console.log('  💡 To enable: CREATE EXTENSION pg_stat_statements;');
            return [];
        }

        // Get slow queries
        const query = `
            SELECT
                substring(query, 1, 100) AS short_query,
                calls,
                total_time,
                mean_time,
                max_time,
                stddev_time
            FROM pg_stat_statements
            WHERE query NOT LIKE '%pg_stat_statements%'
            ORDER BY mean_time DESC
            LIMIT 10;
        `;

        const [results] = await sequelize.query(query);

        if (results.length === 0) {
            console.log('  ℹ️  No query statistics available yet');
            return [];
        }

        console.log('\n  Top 10 Slowest Queries (by mean time):');
        results.forEach((row, index) => {
            console.log(`\n  ${index + 1}. ${row.short_query}...`);
            console.log(`     Calls: ${row.calls}`);
            console.log(`     Mean time: ${parseFloat(row.mean_time).toFixed(2)}ms`);
            console.log(`     Max time: ${parseFloat(row.max_time).toFixed(2)}ms`);
        });

        return results;
    } catch (error) {
        console.error('Error analyzing queries:', error.message);
        return [];
    }
}

/**
 * Suggest indexes based on table structure
 */
async function suggestIndexes() {
    console.log('\n💡 Index Suggestions:');
    console.log('─'.repeat(60));

    const suggestions = [];

    // Common patterns for indexes
    const patterns = [
        { table: 'Users', columns: ['email'], reason: 'Frequent login queries' },
        { table: 'Users', columns: ['role'], reason: 'Role-based queries' },
        { table: 'PurchaseRequests', columns: ['userId', 'status'], reason: 'User request filtering' },
        { table: 'PurchaseRequests', columns: ['status', 'createdAt'], reason: 'Status and date filtering' },
        { table: 'PurchaseRequests', columns: ['categoryId'], reason: 'Category filtering' },
        { table: 'PriceQuotes', columns: ['requestId'], reason: 'Request-quote relationship' },
        { table: 'PriceQuotes', columns: ['sellerId'], reason: 'Seller quote queries' },
        { table: 'AuditLogs', columns: ['createdAt'], reason: 'Date-based cleanup' },
        { table: 'AuditLogs', columns: ['userId'], reason: 'User activity tracking' }
    ];

    // Get existing indexes
    const existingQuery = `
        SELECT
            t.tablename,
            i.indexname,
            array_agg(a.attname ORDER BY a.attnum) as columns
        FROM pg_indexes i
        JOIN pg_class c ON c.relname = i.indexname
        JOIN pg_attribute a ON a.attrelid = c.oid
        JOIN pg_tables t ON i.tablename = t.tablename
        WHERE t.schemaname NOT IN ('pg_catalog', 'information_schema')
        AND a.attnum > 0
        GROUP BY t.tablename, i.indexname;
    `;

    try {
        const [existing] = await sequelize.query(existingQuery);

        patterns.forEach(pattern => {
            const hasIndex = existing.some(idx =>
                idx.tablename === pattern.table &&
                pattern.columns.every(col => idx.columns.includes(col))
            );

            if (!hasIndex) {
                suggestions.push(pattern);
                console.log(`\n  ⚠️  Missing index on ${pattern.table}`);
                console.log(`     Columns: ${pattern.columns.join(', ')}`);
                console.log(`     Reason: ${pattern.reason}`);
                console.log(`     SQL: CREATE INDEX idx_${pattern.table.toLowerCase()}_${pattern.columns.join('_').toLowerCase()} ON "${pattern.table}" (${pattern.columns.map(c => `"${c}"`).join(', ')});`);
            }
        });

        if (suggestions.length === 0) {
            console.log('  ✅ All recommended indexes are present');
        }

        return suggestions;
    } catch (error) {
        console.error('Error suggesting indexes:', error.message);
        return [];
    }
}

/**
 * Generate optimization report
 */
async function generateReport(tableSizes, indexes, queries, suggestions) {
    const report = {
        timestamp: new Date().toISOString(),
        database: {
            name: sequelize.config.database,
            host: sequelize.config.host
        },
        tables: {
            count: tableSizes.length,
            sizes: tableSizes.map(t => ({
                name: t.tablename,
                size: t.size,
                sizeBytes: parseInt(t.size_bytes)
            }))
        },
        indexes: {
            count: indexes.length,
            list: indexes.map(i => ({
                table: i.tablename,
                name: i.indexname
            }))
        },
        queries: {
            analyzed: queries.length,
            slowest: queries.slice(0, 5).map(q => ({
                query: q.short_query,
                calls: parseInt(q.calls),
                meanTime: parseFloat(q.mean_time),
                maxTime: parseFloat(q.max_time)
            }))
        },
        suggestions: suggestions.map(s => ({
            table: s.table,
            columns: s.columns,
            reason: s.reason
        }))
    };

    // Save report
    const reportsDir = path.join(__dirname, '../database-reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `db-analysis-${new Date().toISOString().replace(/:/g, '-')}.json`;
    const filepath = path.join(reportsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    console.log(`\n💾 Report saved to: ${filepath}`);

    return report;
}

/**
 * Main execution
 */
async function main() {
    console.log('\n🔍 Database Analysis Tool');
    console.log('='.repeat(60));

    try {
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connection successful\n');

        // Run analyses
        const tableSizes = await getTableSizes();
        const indexes = await getIndexes();
        const queries = await analyzeQueries();
        const suggestions = await suggestIndexes();

        // Generate report
        const report = await generateReport(tableSizes, indexes, queries, suggestions);

        // Summary
        console.log('\n📋 Summary:');
        console.log('─'.repeat(60));
        console.log(`  Tables: ${tableSizes.length}`);
        console.log(`  Indexes: ${indexes.length}`);
        console.log(`  Slow queries analyzed: ${queries.length}`);
        console.log(`  Index suggestions: ${suggestions.length}`);

        if (suggestions.length > 0) {
            console.log('\n⚠️  Action Required:');
            console.log(`  ${suggestions.length} missing indexes detected`);
            console.log('  Review suggestions above and create indexes');
        } else {
            console.log('\n✅ Database is well-optimized');
        }

        console.log('\n✅ Analysis complete!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(err => {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    });
}

module.exports = { getTableSizes, getIndexes, analyzeQueries, suggestIndexes };
