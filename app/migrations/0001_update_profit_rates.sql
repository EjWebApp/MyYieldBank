-- profitRate를 profit_rate로 변경하고 numeric 타입으로 변경 (컬럼이 존재하는 경우에만)
DO $$ 
BEGIN
  -- profitRate 컬럼이 있으면 profit_rate로 이름 변경
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'assets' AND column_name = 'profitRate') THEN
    ALTER TABLE "assets" RENAME COLUMN "profitRate" TO "profit_rate";
  END IF;
  
  -- profit_rate 컬럼의 타입을 numeric으로 변경
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'assets' AND column_name = 'profit_rate' 
             AND data_type != 'numeric') THEN
    ALTER TABLE "assets" 
      ALTER COLUMN "profit_rate" TYPE numeric(10, 2) USING profit_rate::numeric(10, 2);
  END IF;
END $$;

-- take_profit_rate와 stop_loss_rate 컬럼 추가 (없는 경우)
ALTER TABLE "assets" 
  ADD COLUMN IF NOT EXISTS "take_profit_rate" numeric(10, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "assets" 
  ADD COLUMN IF NOT EXISTS "stop_loss_rate" numeric(10, 2) DEFAULT '0' NOT NULL;
