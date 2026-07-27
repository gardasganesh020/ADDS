def print_parallelogram_pattern(n):
    """
    Print a parallelogram pattern using asterisks (*)
    where n is the number of columns and stars in each row
    """
    for i in range(n):
        spaces = " " * i
        # Print stars
        stars = "*" * n
        print(spaces + stars)

def main():
    try:
    
        n = int(input("Enter the number of columns and stars (n): "))
        
        if n <= 0:
            print("Please enter a positive integer.")
            return
            
        print(f"\nParallelogram pattern with {n} columns and {n} stars:\n")
        print_parallelogram_pattern(n)
        
    except ValueError:
        print("Please enter a valid integer.")

if __name__ == "__main__":
    main() 