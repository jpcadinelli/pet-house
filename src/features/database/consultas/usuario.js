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

export const buscarUsuarioPorId = (db, idUsuario) => {
    return db.getFirstSync(
        'SELECT * FROM usuarios WHERE id = ?',
        [idUsuario]
    );
};

export const createUser = (db, nome, email, senha, firebaseUid = null) => {
    const agoraUtc = Date.now();

    return db.runSync(
        'INSERT INTO usuarios (nome, email, senha, firebase_uid, atualizado_em, sincronizado_em) VALUES (?, ?, ?, ?, ?, ?)',
        [nome, email, senha, firebaseUid, agoraUtc, firebaseUid ? agoraUtc : null]
    );
};

export const atualizarFirebaseUidUsuario = (db, idUsuario, firebaseUid) => {
    const agoraUtc = Date.now();

    return db.runSync(
        'UPDATE usuarios SET firebase_uid = ?, atualizado_em = ? WHERE id = ?',
        [firebaseUid, agoraUtc, idUsuario]
    );
};

export const marcarUsuarioSincronizado = (db, idUsuario, sincronizadoEm = Date.now()) => {
    return db.runSync(
        'UPDATE usuarios SET sincronizado_em = ? WHERE id = ?',
        [sincronizadoEm, idUsuario]
    );
};
