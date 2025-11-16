import { supabase } from "@/lib/apis/supabaseClient";
import React, { useEffect, useState } from "react";

export default function MenuMonitoring() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // 초기 데이터 로드
    supabase
      .from("menus")
      .select("*")
      .then(({ data }) => setData(data || []));

    // 실시간 구독
    const subscription = supabase
      .channel("public:menus")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menus" },
        (payload) => {
          // payload.eventType: INSERT, UPDATE, DELETE
          if (payload.eventType === "INSERT") {
            setData((prev) => [...prev, payload.new]);
          }
          if (payload.eventType === "UPDATE") {
            setData((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? payload.new : item
              )
            );
          }
          if (payload.eventType === "DELETE") {
            setData((prev) =>
              prev.filter((item) => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div>
      asdfdf
      {data.map((menu) => (
        <div key={menu.id}>
          {menu.name} - {menu.current_stock}개
        </div>
      ))}
    </div>
  );
}
