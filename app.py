from flask import Flask, request, jsonify
from sympy import symbols, solve, sqrt, nsimplify, sympify, Rational, N, Float, S, Expr, Number
#from sympy.core.numbers import Float

from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/solve_conic_intersection', methods=['POST'])
def solve_conic_intersection_route():
    data = request.get_json()
    equation1 = data['equation1']
    equation2 = data['equation2']
    solutions = solve_conic_intersection(equation1, equation2)
    return jsonify(solutions)

def simplify_and_round(expr, decimal_places=4):
    def round_number(num):
        if isinstance(num, (float, Float, Rational)):
            return Float(round(float(num), decimal_places))
        return num

    if isinstance(expr, (float, Float, int, Number)):
        return round_number(expr)
    elif isinstance(expr, Expr):
        return expr.xreplace({n: round_number(n) for n in expr.atoms(Number)})
    else:
        return expr
    
def solve_conic_intersection(equation1, equation2):
    x, y = symbols('x y')
    
    A1, B1, C1, D1, E1, F1 = equation1['A'], equation1['B'], equation1['C'], equation1['D'], equation1['E'], equation1['F']
    A2, B2, C2, D2, E2, F2 = equation2['A'], equation2['B'], equation2['C'], equation2['D'], equation2['E'], equation2['F']

    print("A1 BEFORE: ", A1)
    A1 = round(A1, 4)
    print("A1 AFTER: ", A1)
    B1 = round(B1, 4)
    print("B1 AFTER: ", B1)
    C1 = round(C1, 4)
    print("C1 AFTER: ", C1)
    D1 = round(D1, 4)
    print("D1 AFTER: ", D1)
    E1 = round(E1, 4)
    print("E1 AFTER: ", E1)
    F1 = round(F1, 4)
    print("F1 AFTER: ", F1)
    A2 = round(A2, 4)
    print("A2 AFTER: ", A2)
    B2 = round(B2, 4)
    print("B2 AFTER: ", B2)
    C2 = round(C2, 4)
    print("C2 AFTER: ", C2)
    D2 = round(D2, 4)
    print("D2 AFTER: ", D2)
    E2 = round(E2, 4)
    print("E2 AFTER: ", E2)
    F2 = round(F2, 4)
    print("F2 AFTER: ", F2)

    is_c_zero = C1 == 0
    is_a_zero = A1 == 0
    is_sum_e_zero = E1 + E2 == 0

    """ Create if-statements to define four sub-cases:
    1. C1 = 0 & A1 != 0
    2. C1 != 0
    3. C1 = 0 & A1 = 0 & E1+E2 != 0s
    4. C1 = 0 & A1 = 0 & E1+E2 = 0. """
    if is_c_zero and not is_a_zero:
        discriminant = sqrt((B1*y+D1)**2 - 4*A1*(E1*y+F1))
        y_expr1 = (-(B1*y + D1) + discriminant) / (2*A1)
        y_expr2 = (-(B1*y + D1) - discriminant) / (2*A1)
    elif not is_c_zero:
        discriminant = sqrt((B1**2 - 4*A1*C1)*x**2 + (2*B1*E1 - 4*C1*D1)*x + (E1**2 - 4*C1*F1))
        y_expr1 = (-(B1*x + E1) + discriminant) / (2*C1)
        y_expr2 = (-(B1*x + E1) - discriminant) / (2*C1)
    else:
        discriminant = None  # Ignore discriminant.
        y_expr2 = None  # Ignore second y_expr.
        if not is_sum_e_zero:
            y_expr1 = (-(D1+D2)*x - (F1+F2)) / (E1+E2)
        else:
            y_expr1 = (-(E1+E2)*y - (F1+F2)) / (D1+D2)

    print("y_expr1 unsimplified:", y_expr1)
    print("y_expr2 unsimplified:", y_expr2)
    y_expr1 = simplify_and_round(y_expr1)
    y_expr2 = simplify_and_round(y_expr2)
    print("y_expr1 simplified:", y_expr1)
    print("y_expr2 simplified:", y_expr2)

    if is_c_zero and not is_a_zero:
        # Substitute expressions for x into equation2. substituted_eq1 and substituted_eq2 are then equations in y.
        substituted_eq1 = A2*y_expr1**2 + B2*y_expr1*y + C2*y**2 + D2*y_expr1 + E2*y + F2
        substituted_eq2 = A2*y_expr2**2 + B2*y_expr2*y + C2*y**2 + D2*y_expr2 + E2*y + F2
    elif not is_c_zero:
        # Substitute expressions for y into equation2.
        substituted_eq1 = A2*x**2 + B2*x*y_expr1 + C2*y_expr1**2 + D2*x + E2*y_expr1 + F2
        substituted_eq2 = A2*x**2 + B2*x*y_expr2 + C2*y_expr2**2 + D2*x + E2*y_expr2 + F2
    else:
        substituted_eq2 = None
        if not is_sum_e_zero:
            substituted_eq1 = A2*x**2 + B2*x*y_expr1 + C2*y_expr1**2 + D2*x + E2*y_expr1 + F2
        else:
            substituted_eq1 = A2*y_expr1**2 + B2*y_expr1*y + C2*y**2 + D2*y_expr1 + E2*y + F2

    print("substituted_eq1 unsimplified:", substituted_eq1)
    print("substituted_eq2 unsimplified:", substituted_eq2)
    substituted_eq1 = simplify_and_round(substituted_eq1)
    substituted_eq2 = simplify_and_round(substituted_eq2)
    print("substituted_eq1 simplified:", substituted_eq1)
    print("substituted_eq2 simplified:", substituted_eq2)

    roots1 = set()
    roots2 = set()

    try:
        # Solve substituted_eq1 and substituted_eq2 for either x or y, depending on the sub-case.
        if is_c_zero and not is_a_zero:
            roots_solve1 = solve(substituted_eq1, y)
            roots_solve2 = solve(substituted_eq2, y)
        elif not is_c_zero:
            roots_solve1 = solve(substituted_eq1, x)
            roots_solve2 = solve(substituted_eq2, x)
        else:
            roots_solve2 = None
            if not is_sum_e_zero:
                roots_solve1 = solve(substituted_eq1, x)
            else:
                roots_solve1 = solve(substituted_eq1, y)

        print("roots_solve1:", roots_solve1)
        print("roots_solve2:", roots_solve2)

        for root in roots_solve1:
            try:
                root_value = complex(root.evalf())
                if abs(root_value.imag) < 1e-10 and root_value.real > 0:  # If the imaginary part of a root is essentially zero, then:
                    roots1.add(round(root_value.real, 4))  # consider the root as only the real part, rounded to 4 decimal places.
            except:
                pass  # Skip any roots that can't be converted to complex numbers.

        if roots_solve2:
            roots2 = set()
            for root in roots_solve2:
                try:
                    root_value = complex(root.evalf())
                    if abs(root_value.imag) < 1e-10 and root_value.real > 0:
                        roots2.add(round(root_value.real, 4))
                except:
                    pass
        print("Processed real x/y roots1:", roots1)
        print("Processed real x/y roots2:", roots2)
    except Exception as error:
        print("Error solving equation for roots1 and roots2:", error)

    general_conic = (A1-A2)*x**2 + (B1-B2)*x*y + (C1-C2)*y**2 + (D1-D2)*x + (E1-E2)*y + (F1-F2)
    general_conic = simplify_and_round(general_conic)
    test_conic1 = A1*x**2 + B1*x*y + C1*y**2 + D1*x + E1*y + F1
    test_conic2 = A2*x**2 + B2*x*y + C2*y**2 + D2*x + E2*y + F2

    # For each root of x or y, determine the corresponding y or x-coordinate, respectively. Return the resulting site if it is a valid intersection point.
    def process_root(root):
        try:
            x_val = float(root)
            x_val = round(x_val, 4)

            # Plug root for y (x) into general conic equation to return an equation solely in x (y), depending on the sub-case.
            if is_c_zero and not is_a_zero:
                y_equation = general_conic.subs(y, x_val)
                y_roots_solve = solve(y_equation, x)
            elif not is_c_zero:
                y_equation = general_conic.subs(x, x_val)
                y_roots_solve = solve(y_equation, y)
            else:
                if not is_sum_e_zero:
                    y_equation = general_conic.subs(x, x_val)
                    y_roots_solve = solve(y_equation, y)
                else:
                    y_equation = general_conic.subs(y, x_val)
                    y_roots_solve = solve(y_equation, x)
            print("y_roots_solve: ", y_roots_solve)

            solutions = []
            # best_solution = None
            # smallest_difference = float('inf')

            for y_root in y_roots_solve:
                try:
                    # Check if y_root is negative; if so, ignore.
                    if y_root < 0:
                        continue

                    # Map each root in x (y) to its corresponding y (x) - coordinate. This yields a potential solution (x, y).
                    if is_c_zero and not is_a_zero:
                        test_x, test_y = float(y_root), x_val
                    elif not is_c_zero:
                        test_x, test_y = x_val, float(y_root)
                    else:
                        if not is_sum_e_zero:
                            test_x, test_y = x_val, float(y_root)
                        else:
                            test_x, test_y = float(y_root), x_val

                    test_x = round(test_x, 4)
                    test_y = round(test_y, 4)
                    # Check if (x, y) is an extraneous solution. If it is, ignore; else, add it to our solutions array.
                    # evaluate_eq1 = test_conic1.subs({x: test_x, y: test_y}).evalf()
                    # evaluate_eq2 = test_conic2.subs({x: test_x, y: test_y}).evalf()
                    # Evaluate both equations for this potential solution
                    evaluate_eq1 = abs(float(test_conic1.subs({x: test_x, y: test_y}).evalf()))
                    evaluate_eq2 = abs(float(test_conic2.subs({x: test_x, y: test_y}).evalf()))

                    print("testing if (", test_x, ",", test_y, ") is extraneous...")
                    print("evaluate_eq1:", evaluate_eq1)
                    print("evaluate_eq2:", evaluate_eq2)

                    difference = abs(evaluate_eq1 - evaluate_eq2)
                    print(f"difference: {difference}")

                    epsilon = 10000
                    difference = abs(float(evaluate_eq1) - float(evaluate_eq2))
                    print("difference:", difference)
                    if difference < epsilon:
                        solutions.append({"testX": test_x, "testY": test_y})
                    # if difference < smallest_difference:
                    #     smallest_difference = difference
                    #     best_solution = {"testX": test_x, "testY": test_y}

                except Exception as error:
                    print(f"Error processing root {y_root}: {error}")
                # if best_solution:
                #     solutions.append(best_solution)

            print ("Solutions: ", solutions)
            return solutions
        except Exception as error:
            print("Error in process_root():", error)
            return None

    solutions = []
    roots_array = list(roots1) + list(roots2)
    print("roots1 + roots2 combined:", roots_array)

    for root in roots_array:
        # For each root, process it into a solution of the form (x, y), where (x, y) is an intersection point of equation1 and equation2.
        root_solutions = process_root(root)
        if root_solutions:
            solutions.extend(root_solutions)

    epsilon = 1e-9
    solutions = [sol for sol in solutions if sol is not None]

    # Remove duplicate intersection points.
    unique_solutions = []
    for sol in solutions:
        is_duplicate = False
        for uniq_sol in unique_solutions:
            difference_x = abs(sol["testX"] - uniq_sol["testX"])
            difference_y = abs(sol["testY"] - uniq_sol["testY"])
            if difference_x < epsilon and difference_y < epsilon:
                is_duplicate = True
                break
        if not is_duplicate:
            unique_solutions.append(sol)

    return unique_solutions

if __name__ == '__main__':
    app.run(debug=True)