import sqlite3

def fix_db():
    conn = sqlite3.connect("lexai.db")
    cursor = conn.cursor()
    
    # Try adding is_active to clients
    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1")
        print("Added is_active to clients")
    except sqlite3.OperationalError as e:
        print("Error adding is_active:", e)
        
    # Try adding priority to tasks
    try:
        cursor.execute("ALTER TABLE tasks ADD COLUMN priority VARCHAR(64) NOT NULL DEFAULT 'Medium'")
        print("Added priority to tasks")
    except sqlite3.OperationalError as e:
        print("Error adding priority:", e)
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_db()
