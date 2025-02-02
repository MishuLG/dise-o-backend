import { pool } from '../database/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';


export const getAllUsersModel = async () => {
    const query = `
        SELECT uid_users, id_rols, first_name, last_name, dni, number_tlf, email, 
               TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, 
               gender, status, 
               TO_CHAR(created_at, 'YYYY-MM-DD') AS created_at, 
               TO_CHAR(updated_at, 'YYYY-MM-DD') AS updated_at
        FROM users;
    `;
    const result = await pool.query(query);
    return result.rows;
};


export const getUserByIdModel = async (id) => {
    const query = `
        SELECT uid_users, id_rols, first_name, last_name, dni, number_tlf, email, 
               TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, 
               gender, status, 
               TO_CHAR(created_at, 'YYYY-MM-DD') AS created_at, 
               TO_CHAR(updated_at, 'YYYY-MM-DD') AS updated_at
        FROM users WHERE uid_users = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};


export const createUserModel = async (userData) => {
    const { id_rols, first_name, last_name, dni, number_tlf, email, password, date_of_birth, gender, status = 'Active' } = userData;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const query = `
        INSERT INTO users (uid_users, id_rols, first_name, last_name, dni, number_tlf, email, password, date_of_birth, gender, created_at, updated_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, CURRENT_DATE, $11) RETURNING *;
    `;
    const result = await pool.query(query, [
        generateUid(),
        id_rols,
        first_name,
        last_name,
        dni,
        number_tlf,
        email,
        hashedPassword,
        date_of_birth,
        gender,
        status
    ]);

    return result.rows[0];
};


export const updateUserByIdModel = async (id, userData) => {
    const { id_rols, first_name, last_name, dni, number_tlf, email, password, date_of_birth, gender, status } = userData;

    const validStatuses = ['active', 'inactive', 'suspended'];
    const statusValue = validStatuses.includes(status) ? status : null;

    const query = `
        UPDATE users SET 
            id_rols = COALESCE($1, id_rols), 
            first_name = COALESCE($2, first_name), 
            last_name = COALESCE($3, last_name), 
            dni = COALESCE($4, dni),
            number_tlf = COALESCE($5, number_tlf),
            email = COALESCE($6, email),
            password = COALESCE($7, password),
            date_of_birth = COALESCE($8, date_of_birth),
            gender = COALESCE($9, gender),
            status = COALESCE($10::user_status, status),
            updated_at = CURRENT_DATE
        WHERE uid_users = $11 RETURNING *;
    `;
    const result = await pool.query(query, [
        id_rols || null,
        first_name || null,
        last_name || null,
        dni || null,
        number_tlf || null,
        email || null,
        password ? bcrypt.hashSync(password, 10) : null,
        date_of_birth || null,
        gender || null,
        status || statusValue ? statusValue : null,
        id
    ]);

    return result.rows[0];
};


export const deleteUserByIdModel = async (id) => {
    const query = `
        DELETE FROM users WHERE uid_users = $1 RETURNING *;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};


export const validateProfessorModel = async (uid_users) => {
    const query = `
        UPDATE users 
        SET status = 'active', updated_at = CURRENT_DATE
        WHERE uid_users = $1 AND id_rols = 2 RETURNING *;
    `;
    const result = await pool.query(query, [uid_users]);
    return result.rows[0];
};


export const getUsersByRoleModel = async (id_rols) => {
    const query = `
        SELECT uid_users, first_name, last_name, email, 
               TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, 
               gender, status
        FROM users WHERE id_rols = $1;
    `;
    const result = await pool.query(query, [id_rols]);
    return result.rows;
};


const generateUid = () => uuidv4();