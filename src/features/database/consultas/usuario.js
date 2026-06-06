export const loginUser = (db, email, senha) => {
    return db.getFirstSync(
        'SELECT * FROM usuarios WHERE email = ? AND senha = ?',
        [email, senha]
    );
};

export const getUserByEmail = (db, email) => {
    return db.getFirstSync(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
    );
};

export const createUser = (db, nome, email, senha) => {
    return db.runSync(
        'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
        [nome, email, senha]
    );
};