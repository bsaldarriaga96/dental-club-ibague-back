import type { RequestHandler } from "express";
import { registerUser, validateLogin, getPublicUserById, claimOrdersForUser  } from "./auth.service";

export const registerController: RequestHandler = async (req, res) => {
  try {
    const { email, password, name, phone, documentType, documentNumber } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      documentType?: string;
      documentNumber?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "email y password son requeridos" });
    }

    const user = await registerUser({ email, password, name, phone, documentType, documentNumber });

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ message: "No se pudo iniciar sesión" });

      req.session.userId = user.id;

      req.session.save((err2) => {
        if (err2) return res.status(500).json({ message: "No se pudo guardar sesión" });
        return res.status(201).json({ user });
      });
    });
  } catch (err: any) {
    if (err.code === "USER_EMAIL_EXISTS" || err.message === "USER_EMAIL_EXISTS") {
      return res.status(409).json({ message: "Ya existe un usuario con ese email" });
    }
    return res.status(500).json({ message: err.message ?? "Error registrando usuario" });
  }
};

export const loginController: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: "email y password son requeridos" });
    }

    const user = await validateLogin({ email, password });

    if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

    req.session.regenerate((regenErr) => {
      if (regenErr) return res.status(500).json({ message: "No se pudo iniciar sesión" });

      req.session.userId = user.id;

      req.session.save((saveErr) => {
        if (saveErr) return res.status(500).json({ message: "No se pudo guardar sesión" });

        return res.json({ ok: true, user });
      });
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message ?? "Error en login" });
  }
};

export const logoutController: RequestHandler = async (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie("sid", { path: "/" });
    if (err) return res.status(500).json({ message: "No se pudo cerrar sesión" });
    return res.json({ ok: true });
  });
};

export const meController: RequestHandler = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await getPublicUserById(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message ?? "Error consultando sesión" });
  }
};

export const claimOrdersController: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await claimOrdersForUser(userId);

    return res.json({ ok: true, claimed: result.claimed });
  } catch (err: any) {
    if (err.code === "EMAIL_NOT_VERIFIED") {
      return res.status(403).json({
        message: "Debes verificar tu email para reclamar pedidos anteriores",
      });
    }
    if (err.code === "USER_NOT_FOUND") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next(err);
  }
};
