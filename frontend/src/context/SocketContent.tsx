import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuthContext } from "./AuthContext";
import io, { Socket } from "socket.io-client";

// 定义 SocketContext 类型
type SocketContextType = {
  socket: Socket | null;
  onlineUsers: string[];
};

const SocketContext = createContext<SocketContextType | null>(null); // 而不是对象

// 自定义 Hook 简化上下文使用
export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (context === null) {
    throw new Error(
      "useSocketContext must be used within a SocketContextProvider"
    );
  }
  return context; // 现在 TypeScript 知道这里返回的一定是 SocketContextType
};

// 定义 Provider 的 Props 类型
interface SocketContextProviderProps {
  children: ReactNode;
}

export const SocketContextProvider = ({
  children,
}: SocketContextProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (authUser) {
      // 初始化 socket 连接
      const socketInstance = io("https://chat-app-ngnt.onrender.com", {
        query: {
          userId: authUser._id,
        },
      });
      setSocket(socketInstance);

      // 监听 "getOnlineUsers" 事件以获取在线用户列表
      socketInstance.on("getOnlineUsers", (users: string[]) => {
        setOnlineUsers(users);
      });

      // 在组件卸载时关闭 socket 连接
      return () => {
        socketInstance.close();
      };
    } else {
      // 如果用户未登录，关闭 socket 并清除状态
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
