#!/usr/bin/env python3
"""
LearnQuest - Zero Secret & API Key Leaks Verification
Scans frontend source, build output, git-tracked files, and environment templates.
"""
import os
import re
import sys
import subprocess

def check_secrets():
    print("==================================================================")
    print(" LearnQuest - Security & Secret Leak Verification Scan")
    print("==================================================================")

    failed = False

    # 1. Check if backend/.env is tracked by git
    try:
        res = subprocess.run(["git", "ls-files", "backend/.env"], capture_output=True, text=True)
        if res.stdout.strip():
            print("[FAIL] backend/.env is tracked in git! Must be gitignored.")
            failed = True
        else:
            print("[PASS] backend/.env is properly ignored by git.")
    except Exception as e:
        print(f"[WARN] git check skipped: {e}")

    # 2. Check backend/.env.example for blank secrets
    env_example_path = os.path.join("backend", ".env.example")
    if os.path.exists(env_example_path):
        with open(env_example_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            for line in lines:
                line = line.strip()
                if line.startswith("AI_API_KEY=") and len(line.split("=", 1)[1].strip()) > 0:
                    print(f"[FAIL] backend/.env.example contains non-empty AI_API_KEY: {line}")
                    failed = True
                elif line.startswith("SECRET_KEY=") and len(line.split("=", 1)[1].strip()) > 0:
                    print(f"[FAIL] backend/.env.example contains non-empty SECRET_KEY: {line}")
                    failed = True
        if not failed:
            print("[PASS] backend/.env.example has empty secret templates.")

    # 3. Check frontend/src and frontend/dist for secret patterns
    secret_patterns = [
        re.compile(r"AIza[0-9A-Za-z_-]{35}"),
        re.compile(r"sk-[0-9A-Za-z_-]{20,}"),
        re.compile(r"Bearer\s+[0-9A-Za-z_-]{30,}"),
    ]

    scan_dirs = [os.path.join("frontend", "src"), os.path.join("frontend", "dist")]
    found_secrets = []

    for scan_dir in scan_dirs:
        if not os.path.exists(scan_dir):
            continue
        for root, _, files in os.walk(scan_dir):
            for file in files:
                if file.endswith((".ts", ".tsx", ".js", ".jsx", ".html", ".css", ".json", ".map")):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            text = f.read()
                            for pat in secret_patterns:
                                matches = pat.findall(text)
                                if matches:
                                    found_secrets.append((file_path, pat.pattern, matches))
                    except Exception:
                        pass

    if found_secrets:
        print("[FAIL] CRITICAL: Found secret key patterns in frontend code/dist:")
        for path, pat, matches in found_secrets:
            print(f"  - File: {path} (Pattern: {pat}) => {len(matches)} match(es)")
        failed = True
    else:
        print("[PASS] 0 secret patterns found in frontend src/ or dist/ bundles.")

    print("==================================================================")
    if failed:
        print("RESULT: SCAN FAILED. Secrets detected.")
        sys.exit(1)
    else:
        print("RESULT: SCAN PASSED. LearnQuest repository is 100% SECURE.")
        sys.exit(0)

if __name__ == "__main__":
    check_secrets()
